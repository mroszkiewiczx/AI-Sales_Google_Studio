// src/hooks/useGenContent.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface ContentPost {
  channel: string;
  variant1: string;
  variant2: string;
  selected_variant?: 1 | 2;
  image_url?: string;
  notion_page_url?: string;
}

export interface ContentGeneration {
  id: string;
  workspace_id: string;
  title: string;
  base_content: string;
  tone: string;
  goal: string;
  channels: string[];
  hashtags: boolean;
  posts: ContentPost[];
  created_by: string;
  created_at: string;
}

export interface ContentSettings {
  id: string;
  workspace_id: string;
  default_tone: string;
  default_goal: string;
  default_channels: string[];
  temperature: number;
  language: string;
}

export function useGenContentTitles() {
  const { currentWorkspace } = useWorkspace();
  return useMutation({
    mutationFn: async (params: { title_or_url: string; context?: string }) => {
      const { data, error } = await supabase.functions.invoke('gen-content-titles', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { titles: string[] };
    }
  });
}

export function useGenContentGenerate() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      base_content?: string;
      channels: string[];
      tone: string;
      goal: string;
      context?: string;
      hashtags: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('gen-content-generate', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { generation_id: string; posts: ContentPost[] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-generations', currentWorkspace?.id] });
    }
  });
}

export function useGenContentImage() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { post_text: string; channel: string; generation_id: string }) => {
      const { data, error } = await supabase.functions.invoke('gen-content-image', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { image_url: string };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-generations', currentWorkspace?.id] });
    }
  });
}

export function useGenContentNotionSave() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { generation_id: string; post_indices: number[] }) => {
      const { data, error } = await supabase.functions.invoke('gen-content-notion-save', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { saved: number[] };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-generations', currentWorkspace?.id] });
    }
  });
}

export function useContentGenerations() {
  const { currentWorkspace } = useWorkspace();
  return useQuery({
    queryKey: ['content-generations', currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_generations')
        .select('*')
        .eq('workspace_id', currentWorkspace!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as ContentGeneration[];
    },
    enabled: !!currentWorkspace?.id
  });
}

export function useContentSettings() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['content-settings', currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_settings')
        .select('*')
        .eq('workspace_id', currentWorkspace!.id)
        .maybeSingle();
      if (error) throw error;
      return data as ContentSettings | null;
    },
    enabled: !!currentWorkspace?.id
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<ContentSettings>) => {
      const { data, error } = await supabase
        .from('content_settings')
        .upsert({ ...settings, workspace_id: currentWorkspace!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-settings', currentWorkspace?.id] });
    }
  });

  return { ...query, updateSettings };
}
