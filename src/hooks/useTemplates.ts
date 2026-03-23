// src/hooks/useTemplates.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Template {
  id: string;
  workspace_id: string;
  created_by?: string;
  category: 'email' | 'sms' | 'followup' | 'offer' | 'other';
  title: string;
  body: string;
  variables: any[];
  use_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTemplates(category?: string) {
  const { currentWorkspace } = useWorkspace();

  return useQuery({
    queryKey: ['templates', currentWorkspace?.id, category],
    queryFn: async () => {
      if (!currentWorkspace) return [];
      
      let q = supabase
        .from('templates')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('is_active', true)
        .order('use_count', { ascending: false });

      if (category && category !== 'all') {
        q = q.eq('category', category);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Template[];
    },
    enabled: !!currentWorkspace?.id
  });
}

export function useSaveTemplate() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<Template>) => {
      if (!currentWorkspace) throw new Error("No workspace selected");
      if (!user) throw new Error("Unauthorized");

      const payload = {
        ...template,
        workspace_id: currentWorkspace.id,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (template.id) {
        const { data, error } = await supabase
          .from('templates')
          .update(payload)
          .eq('id', template.id)
          .eq('workspace_id', currentWorkspace.id)
          .select()
          .single();
        if (error) throw error;
        return data as Template;
      } else {
        const { data, error } = await supabase
          .from('templates')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data as Template;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates', currentWorkspace?.id] });
      toast.success("Szablon został zapisany");
    },
    onError: (error: Error) => {
      toast.error(`Błąd zapisu: ${error.message}`);
    }
  });
}

export function useTemplatePersonalize() {
  const { currentWorkspace } = useWorkspace();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (params: { template_id: string; account_id?: string; custom_vars?: Record<string, string> }) => {
      if (!currentWorkspace) throw new Error("No workspace selected");
      if (!session) throw new Error("Unauthorized");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/template-personalize`,
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
        throw new Error(errorText || "Failed to personalize template");
      }

      return response.json() as Promise<{ personalized_body: string; used_vars: Record<string, string> }>;
    },
    onSuccess: () => {
      toast.success("Szablon został spersonalizowany przez AI");
    },
    onError: (error: Error) => {
      toast.error(`Błąd personalizacji: ${error.message}`);
    }
  });
}

export function useIncrementTemplateUse() {
  const { currentWorkspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (template_id: string) => {
      if (!currentWorkspace) throw new Error("No workspace selected");
      
      const { error } = await supabase.rpc('increment_template_use', { p_template_id: template_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates', currentWorkspace?.id] });
    }
  });
}

export function useDeleteTemplate() {
  const { currentWorkspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (template_id: string) => {
      if (!currentWorkspace) throw new Error("No workspace selected");
      
      const { error } = await supabase
        .from('templates')
        .update({ is_active: false })
        .eq('id', template_id)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates', currentWorkspace?.id] });
      toast.success("Szablon został usunięty");
    },
    onError: (error: Error) => {
      toast.error(`Błąd usuwania: ${error.message}`);
    }
  });
}
