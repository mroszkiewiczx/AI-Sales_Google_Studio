// src/hooks/useCompBrief.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface CompetitorResult {
  id: string;
  workspace_id: string;
  competitor_id: string;
  analyzed_at: string;
  summary: string;
  articles: any[];
  pricing_changes: any[];
  social_activity: any[];
  job_postings: any[];
  created_at: string;
}

export interface CompetitorTracking {
  id: string;
  workspace_id: string;
  competitor_name: string;
  competitor_url: string;
  industry: string;
  monitoring_frequency: string;
  monitor_articles: boolean;
  monitor_social: boolean;
  monitor_pricing: boolean;
  monitor_jobs: boolean;
  last_analyzed_at: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  competitor_results?: CompetitorResult[];
}

export function useCompetitors() {
  const { currentWorkspace } = useWorkspace();
  return useQuery({
    queryKey: ['competitors', currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('competition_tracking')
        .select(`
          *,
          competitor_results(id, analyzed_at, summary, articles, pricing_changes, social_activity, job_postings)
        `)
        .eq('workspace_id', currentWorkspace!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CompetitorTracking[];
    },
    enabled: !!currentWorkspace?.id
  });
}

export function useAddCompetitor() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      competitor_name: string;
      competitor_url?: string;
      industry?: string;
      monitoring_frequency?: string;
      monitor_articles?: boolean;
      monitor_social?: boolean;
      monitor_pricing?: boolean;
      monitor_jobs?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('comp-brief-add', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { competitor_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', currentWorkspace?.id] });
    }
  });
}

export function useAnalyzeCompetitor() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (competitor_id: string) => {
      const { data, error } = await supabase.functions.invoke('comp-brief-analyze', {
        body: { workspace_id: currentWorkspace!.id, competitor_id }
      });
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', currentWorkspace?.id] });
    }
  });
}

export function useDeleteCompetitor() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (competitor_id: string) => {
      const { error } = await (supabase as any)
        .from('competition_tracking')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', competitor_id)
        .eq('workspace_id', currentWorkspace!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', currentWorkspace?.id] });
    }
  });
}
