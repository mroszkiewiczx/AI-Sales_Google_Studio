import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LicenseProduct {
  id: string;
  hubspot_id: string;
  name: string;
  base_price: number;
  billing_period: "monthly" | "annual" | "perpetual";
  category: string;
}

export interface LicenseItem {
  id: string;
  quantity: number;
  is_hidden: boolean;
}

export interface LicenseResults {
  total_net: number;
  total_gross: number;
  maintenance_total: number;
  items: any[];
}

export const useLicenseCalculator = (workspaceId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual" | "perpetual">("monthly");
  const [multiplier, setMultiplier] = useState(1.0);
  const [items, setItems] = useState<Record<string, LicenseItem>>({});
  const [maintenanceOverride, setMaintenanceOverride] = useState<number | undefined>(undefined);
  const [results, setResults] = useState<LicenseResults | null>(null);

  // Fetch products for the current billing period
  const productsQuery = useQuery({
    queryKey: ["license-products", billingPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("license_products")
        .select("*")
        .eq("billing_period", billingPeriod);

      if (error) throw error;
      return data as LicenseProduct[];
    },
  });

  // Initialize items when products are loaded
  useEffect(() => {
    if (productsQuery.data) {
      const newItems = { ...items };
      productsQuery.data.forEach((p) => {
        if (!newItems[p.id]) {
          newItems[p.id] = { id: p.id, quantity: 1, is_hidden: false };
        }
      });
      setItems(newItems);
    }
  }, [productsQuery.data]);

  const calculateMutation = useMutation({
    mutationFn: async ({ save, dealId, accountId }: { save?: boolean; dealId?: string; accountId?: string }) => {
      if (!workspaceId) throw new Error("Workspace ID is required");

      const { data, error } = await supabase.functions.invoke("license-calculate", {
        body: {
          workspace_id: workspaceId,
          billing_period: billingPeriod,
          multiplier,
          items: Object.values(items),
          maintenance_override: maintenanceOverride,
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
        toast.success("Kalkulacja licencji zapisana");
        queryClient.invalidateQueries({ queryKey: ["license-history", workspaceId] });
      } else {
        toast.success("Przeliczono licencje");
      }
    },
    onError: (error) => {
      console.error("License calculation error:", error);
      toast.error("Błąd podczas obliczeń licencji");
    },
  });

  const historyQuery = useQuery({
    queryKey: ["license-history", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("license_calculations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const updateItem = (id: string, updates: Partial<LicenseItem>) => {
    setItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  return {
    billingPeriod,
    setBillingPeriod,
    multiplier,
    setMultiplier,
    items,
    updateItem,
    maintenanceOverride,
    setMaintenanceOverride,
    results,
    products: productsQuery.data || [],
    isLoadingProducts: productsQuery.isLoading,
    calculate: () => calculateMutation.mutate({ save: false }),
    save: (dealId?: string, accountId?: string) => calculateMutation.mutate({ save: true, dealId, accountId }),
    isCalculating: calculateMutation.isPending,
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
  };
};
