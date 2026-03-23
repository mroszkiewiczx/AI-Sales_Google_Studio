// src/hooks/usePodcast.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface PodcastSegment {
  title: string;
  duration_min: number;
  questions: string[];
  content: string[];
}

export interface PodcastEpisode {
  id: string;
  workspace_id: string;
  title: string;
  style: string;
  description: string;
  duration_minutes: number;
  segments_count: number;
  host_name: string;
  guest_name: string;
  segments: PodcastSegment[];
  full_script: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function usePodcastGenerateTitle() {
  const { currentWorkspace } = useWorkspace();
  return useMutation({
    mutationFn: async (context?: string) => {
      const { data, error } = await supabase.functions.invoke('podcast-generate-title', {
        body: { workspace_id: currentWorkspace!.id, context }
      });
      if (error) throw error;
      return data as { titles: string[] };
    }
  });
}

export function usePodcastGenerate() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      style: string;
      description?: string;
      duration_minutes: number;
      segments_count: number;
      host_name?: string;
      guest_name?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('podcast-generate', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { episode_id: string; segments: PodcastSegment[]; full_script: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast-episodes', currentWorkspace?.id] });
    }
  });
}

export function usePodcastEpisodes() {
  const { currentWorkspace } = useWorkspace();
  return useQuery({
    queryKey: ['podcast-episodes', currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('podcast_episodes')
        .select('id, title, style, duration_minutes, created_at')
        .eq('workspace_id', currentWorkspace!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentWorkspace?.id
  });
}

export function usePodcastEpisode(episodeId: string | null) {
  const { currentWorkspace } = useWorkspace();
  return useQuery({
    queryKey: ['podcast-episode', episodeId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('podcast_episodes')
        .select('*')
        .eq('id', episodeId!)
        .eq('workspace_id', currentWorkspace!.id)
        .single();
      if (error) throw error;
      return data as PodcastEpisode;
    },
    enabled: !!episodeId && !!currentWorkspace?.id
  });
}

export function useSavePodcastScript() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, full_script }: { id: string; full_script: string }) => {
      const { data, error } = await (supabase as any)
        .from('podcast_episodes')
        .update({ full_script, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', currentWorkspace!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['podcast-episode', data.id] });
    }
  });
}
