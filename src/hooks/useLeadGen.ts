// src/hooks/useLeadGen.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface LeadResult {
  place_id: string;
  name: string;
  address: string;
  rating: number;
  reviews_count: number;
  phone?: string;
  website?: string;
  lat: number;
  lng: number;
  types?: string[];
}

export interface SearchConfig {
  region: string;
  industry: string;
  min_rating: number;
  min_reviews: number;
  has_website: boolean;
  max_results: number;
  keyword?: string;
}

export function useLeadGenSearch() {
  const { currentWorkspace } = useWorkspace();
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: SearchConfig) => {
      const { data, error } = await supabase.functions.invoke('lead-gen-search', {
        body: { workspace_id: currentWorkspace!.id, ...config }
      });
      if (error) throw error;
      return data as { search_id: string; results: LeadResult[]; results_count: number };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-gen-results', currentWorkspace?.id] })
  });
}

export function useLeadGenExport() {
  const { currentWorkspace } = useWorkspace();
  
  return useMutation({
    mutationFn: async (params: { search_id: string; indices?: number[] }) => {
      const { data, error } = await supabase.functions.invoke('lead-gen-export', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      
      // The function returns CSV content
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leady-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });
}

export function useLeadGenHistory() {
  const { currentWorkspace } = useWorkspace();
  
  return useQuery({
    queryKey: ['lead-gen-results', currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('lead_gen_results')
        .select('id, search_config, results_count, created_at')
        .eq('workspace_id', currentWorkspace!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!currentWorkspace?.id
  });
}

export function useLeadSearchConfigs() {
  const { currentWorkspace } = useWorkspace();
  const qc = useQueryClient();

  const { data: configs } = useQuery({
    queryKey: ['lead-search-configs', currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('lead_search_configs')
        .select('*')
        .eq('workspace_id', currentWorkspace!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentWorkspace?.id
  });

  const saveConfig = useMutation({
    mutationFn: async (params: { name: string; config: SearchConfig }) => {
      const { error } = await (supabase as any)
        .from('lead_search_configs')
        .insert({ 
          workspace_id: currentWorkspace!.id, 
          name: params.name,
          config: params.config 
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-search-configs', currentWorkspace?.id] })
  });

  return { configs: configs ?? [], saveConfig };
}

export function useImportLeadsToCRM() {
  const { currentWorkspace } = useWorkspace();
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (leads: LeadResult[]) => {
      const accounts = leads.map(l => ({
        workspace_id: currentWorkspace!.id,
        name: l.name,
        address: l.address,
        phone: l.phone,
        website: l.website,
        source: 'lead_gen',
        google_place_id: l.place_id,
        google_rating: l.rating,
      }));
      const { error } = await (supabase as any).from('accounts').insert(accounts);
      if (error) throw error;
      return accounts.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts', currentWorkspace?.id] })
  });
}
