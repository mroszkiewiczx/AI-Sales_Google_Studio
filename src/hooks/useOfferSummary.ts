import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface OfferSummary {
  id: string;
  workspace_id: string;
  created_by: string;
  deal_id?: string;
  account_id?: string;
  client_name: string;
  client_nip: string;
  client_krs: string;
  client_regon: string;
  client_address: string;
  client_contact_person: string;
  client_contact_date: string;
  decision_makers: any[];
  license_calc_id?: string;
  implementation_calc_id?: string;
  dev_calc_id?: string;
  hardware_calc_id?: string;
  roi_calc_id?: string;
  payment_schedule: any[];
  hubspot_deal_id?: string;
  hubspot_synced_at?: string;
  status: 'draft' | 'generated' | 'sent';
  pdf_url?: string;
  notes?: string;
  total_net?: number;
  created_at: string;
  updated_at: string;
  hardware_calculations?: any;
  license_calculations?: any;
  implementation_calculations?: any;
  dev_calculations?: any;
  roi_calculations?: any;
}

export const useOfferSummary = (summaryId?: string) => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ["offer_summary", summaryId],
    queryFn: async () => {
      if (!summaryId) return null;
      const { data, error } = await supabase
        .from("offer_summaries")
        .select(`
          *,
          hardware_calculations(*),
          license_calculations(*),
          implementation_calculations(*),
          dev_calculations(*),
          roi_calculations(*)
        `)
        .eq("id", summaryId)
        .single();
      if (error) throw error;
      return data as OfferSummary;
    },
    enabled: !!summaryId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<OfferSummary>) => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      if (summaryId) {
        const { data: updated, error } = await supabase
          .from("offer_summaries")
          .update(data)
          .eq("id", summaryId)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from("offer_summaries")
          .insert({
            ...data,
            workspace_id: currentWorkspace.id,
            created_by: user?.uid,
          })
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["offer_summary", data.id] });
      queryClient.invalidateQueries({ queryKey: ["offer_summaries"] });
    },
  });

  const lookupCompany = useMutation({
    mutationFn: async (params: { nip?: string; krs?: string }) => {
      const { data, error } = await supabase.functions.invoke("company-lookup", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
  });

  const createHubSpotDeal = useMutation({
    mutationFn: async () => {
      if (!summaryId) throw new Error("No summary selected");
      const { data, error } = await supabase.functions.invoke("hubspot-create-deal", {
        body: { summary_id: summaryId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer_summary", summaryId] });
    },
  });

  const exportPdf = useMutation({
    mutationFn: async () => {
      if (!summaryId) throw new Error("No summary selected");
      const { data, error } = await supabase.functions.invoke("offer-export-pdf", {
        body: { summary_id: summaryId },
      });
      if (error) throw error;
      return data;
    },
  });

  return {
    summary,
    isLoading,
    error,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    lookupCompany: lookupCompany.mutateAsync,
    isLookingUp: lookupCompany.isPending,
    createHubSpotDeal: createHubSpotDeal.mutate,
    isCreatingDeal: createHubSpotDeal.isPending,
    exportPdf: exportPdf.mutate,
    isExportingPdf: exportPdf.isPending,
  };
};
