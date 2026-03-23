// src/hooks/useGenDocs.ts
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PageContent {
  page_num: number;
  content_md: string;
}

export interface GeneratedDocument {
  id: string;
  workspace_id: string;
  created_by: string;
  doc_type: string;
  prompt: string;
  tone: string;
  model_used: string;
  source_files: any[];
  pages_content: PageContent[];
  output_url?: string;
  tokens_used?: number;
  cost_usd?: number;
  created_at: string;
}

export function useGenDocsGenerate() {
  const { currentWorkspace } = useWorkspace();
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      doc_type: string;
      prompt: string;
      tone: string;
      model: string;
      source_file_urls: string[];
      use_brand: boolean;
    }) => {
      if (!currentWorkspace) throw new Error("No workspace selected");
      if (!session) throw new Error("Unauthorized");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gen-docs-generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: currentWorkspace.id,
            ...params,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate document");
      }

      return response.json() as Promise<{ document_id: string; pages_content: PageContent[] }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['generated-documents', currentWorkspace?.id] });
      toast.success("Dokument został wygenerowany pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(`Błąd generowania: ${error.message}`);
    }
  });
}

export function useUploadSourceFile() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!currentWorkspace) throw new Error("No workspace selected");
      
      const ext = file.name.split('.').pop();
      const path = `${currentWorkspace.id}/${crypto.randomUUID()}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from('doc-sources')
        .upload(path, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('doc-sources')
        .getPublicUrl(path);

      return { path, publicUrl, fileName: file.name, fileType: file.type };
    }
  });
}

export function useGenDocsHistory() {
  const { currentWorkspace } = useWorkspace();

  return useQuery({
    queryKey: ['generated-documents', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace) return [];
      
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as GeneratedDocument[];
    },
    enabled: !!currentWorkspace?.id
  });
}

export function useGenDocsExport() {
  const { currentWorkspace } = useWorkspace();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (params: { document_id: string; format: 'docx' | 'pdf' | 'pptx' | 'html' }) => {
      if (!currentWorkspace) throw new Error("No workspace selected");
      if (!session) throw new Error("Unauthorized");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gen-docs-export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: currentWorkspace.id,
            ...params,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to export document");
      }

      return response.json() as Promise<{ download_url: string }>;
    },
    onSuccess: (data) => {
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
      toast.success("Eksport zakończony pomyślnie");
    },
    onError: (error: Error) => {
      toast.error(`Błąd eksportu: ${error.message}`);
    }
  });
}
