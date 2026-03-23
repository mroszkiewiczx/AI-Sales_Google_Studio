import { useQuery } from "@tanstack/react-query";
import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface DashboardSummary {
  pipeline_value: number;
  weighted_pipeline: number;
  deals_closing_this_month: number;
  unread_emails: number;
  tasks_due_today: number;
  stale_deals: number;
  meetings_without_briefing: number;
  lead_inflow_by_source: Record<string, number>;
  forecast_value: number;
  forecast_target: number;
}

export function useDashboardSummary() {
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();

  return useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary", currentWorkspace?.id],
    enabled: !!currentWorkspace && !workspaceLoading,
    queryFn: async () => {
      const q = query(collection(db, `workspaces/${currentWorkspace!.id}/deals`));
      const snapshot = await getDocs(q);
      const deals = snapshot.docs.map(doc => doc.data());

      const pipeline_value = deals.reduce((acc, deal) => acc + (deal.amount || 0), 0);
      const weighted_pipeline = deals.reduce((acc, deal) => {
        const weight = deal.stage === 'closed_won' ? 1 : deal.stage === 'closed_lost' ? 0 : 0.5;
        return acc + (deal.amount || 0) * weight;
      }, 0);

      return {
        pipeline_value,
        weighted_pipeline,
        deals_closing_this_month: deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length,
        unread_emails: 0,
        tasks_due_today: 0,
        stale_deals: 0,
        meetings_without_briefing: 0,
        lead_inflow_by_source: {},
        forecast_value: weighted_pipeline,
        forecast_target: 100000,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
