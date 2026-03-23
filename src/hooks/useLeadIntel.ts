import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface LeadIntelData {
  company_info: {
    name: string;
    nip: string;
    krs: string;
    address: string;
    employees: string;
    revenue_estimate: string;
  };
  crm_data: any;
  web_summary: string;
  news: string[];
  key_facts: string[];
  risks: string[];
  sources: string[];
}

export function useLeadIntel(query: string) {
  const { currentWorkspace } = useWorkspace();

  return useQuery<LeadIntelData>({
    queryKey: ["lead-intel", currentWorkspace?.id, query],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("lead-intel-search", {
        body: { workspace_id: currentWorkspace!.id, query },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!currentWorkspace?.id && !!query && query.length > 2,
    staleTime: 5 * 60 * 1000,
  });
}
