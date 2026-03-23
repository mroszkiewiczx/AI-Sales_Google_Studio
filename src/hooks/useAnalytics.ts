import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface AnalyticsKpi {
  revenue: number;
  revenue_change: number | null;
  conversion_rate: number;
  conversion_change: number | null;
  avg_close_days: number;
  close_days_change: number | null;
  open_deals_count: number;
  open_deals_value: number;
  avg_bant_score: number | null;
  transcripts_count: number;
  tasks_completed_count: number;
  new_leads_count: number;
  win_rate: number | null;
}

export interface PipelineStage {
  name: string;
  value: number;
}

export interface LeadSource {
  source: string;
  leads: number;
  conversion: number;
  revenue: number;
}

export interface SalespersonRanking {
  name: string;
  closed_deals: number;
  revenue: number;
  commission: number;
}

export interface AnalyticsData {
  kpi: AnalyticsKpi;
  pipeline: PipelineStage[];
  leadSources: LeadSource[];
  ranking: SalespersonRanking[];
}

export function useAnalytics(period: string) {
  const { currentWorkspace } = useWorkspace();

  return useQuery<AnalyticsData>({
    queryKey: ["analytics", currentWorkspace?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-analytics", {
        body: { workspace_id: currentWorkspace!.id, period },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!currentWorkspace?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
