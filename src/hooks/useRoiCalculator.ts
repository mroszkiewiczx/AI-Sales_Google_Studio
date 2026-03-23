import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RoiInputs {
  employees: number;
  hourlyRate: number;
  wasteMinutes: number;
  inventoryValue: number;
  inventoryOptPct: number;
  annualTurnover: number;
  productionGrowthPct: number;
  licenseCost: number;
  implementationCost: number;
  licenseType: "subscription" | "license";
  licenseYears: number;
  leaseMonths: number;
  initialPaymentPct: number;
}

export interface RoiResults {
  annualLaborLoss: number;
  freedCapital: number;
  lostProfit: number;
  totalGain: number;
  investTotal: number;
  paybackMonths: number;
  monthlyGain: number;
  leaseMonthly: number;
  leaseInitPayment: number;
}

export const useRoiCalculator = (workspaceId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [inputs, setInputs] = useState<RoiInputs>({
    employees: 10,
    hourlyRate: 35,
    wasteMinutes: 15,
    inventoryValue: 100000,
    inventoryOptPct: 15,
    annualTurnover: 5000000,
    productionGrowthPct: 5,
    licenseCost: 45000,
    implementationCost: 25000,
    licenseType: "subscription",
    licenseYears: 3,
    leaseMonths: 24,
    initialPaymentPct: 20,
  });

  const [results, setResults] = useState<RoiResults | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async ({ save, dealId, accountId }: { save?: boolean; dealId?: string; accountId?: string }) => {
      if (!workspaceId) throw new Error("Workspace ID is required");

      const { data, error } = await supabase.functions.invoke("roi-calculate", {
        body: {
          workspace_id: workspaceId,
          inputs: {
            employees: inputs.employees,
            hourly_rate: inputs.hourlyRate,
            waste_minutes: inputs.wasteMinutes,
            inventory_value: inputs.inventoryValue,
            inventory_opt_pct: inputs.inventoryOptPct,
            annual_turnover: inputs.annualTurnover,
            production_growth_pct: inputs.productionGrowthPct,
            license_cost: inputs.licenseCost,
            implementation_cost: inputs.implementationCost,
            license_type: inputs.licenseType,
            license_years: inputs.licenseYears,
            lease_months: inputs.leaseMonths,
            initial_payment_pct: inputs.initialPaymentPct,
          },
          save,
          deal_id: dealId,
          account_id: accountId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      setResults(data.results);
      if (variables.save) {
        toast.success("Kalkulacja zapisana pomyślnie");
        queryClient.invalidateQueries({ queryKey: ["roi-history", workspaceId] });
      } else {
        toast.success("Przeliczono ROI");
      }
    },
    onError: (error) => {
      console.error("ROI calculation error:", error);
      toast.error("Błąd podczas obliczeń ROI");
    },
  });

  const historyQuery = useQuery({
    queryKey: ["roi-history", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("roi_calculations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  return {
    inputs,
    setInputs,
    results,
    calculate: () => calculateMutation.mutate({ save: false }),
    save: (dealId?: string, accountId?: string) => calculateMutation.mutate({ save: true, dealId, accountId }),
    isCalculating: calculateMutation.isPending,
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
  };
};
