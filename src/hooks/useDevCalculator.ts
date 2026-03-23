import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

export interface DevRow {
  id: string;
  nazwa: string;
  kwota: number;
}

export function useDevCalculator() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<DevRow[]>([
    { id: crypto.randomUUID(), nazwa: "Customizacja raportu", kwota: 0 },
  ]);
  const [total, setTotal] = useState(0);
  const [calculationId, setCalculationId] = useState<string | null>(null);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, { id: crypto.randomUUID(), nazwa: "Nowa pozycja", kwota: 0 }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: "nazwa" | "kwota", value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const calculateMutation = useMutation({
    mutationFn: async (params: { save?: boolean; deal_id?: string }) => {
      if (!currentWorkspace?.id) throw new Error("Workspace is required");
      
      const { data, error } = await supabase.functions.invoke("dev-calculate", {
        body: {
          workspace_id: currentWorkspace.id,
          line_items: rows,
          ...params,
        },
      });
      
      if (error) throw error;
      return data as { total: number; calculation_id?: string };
    },
    onSuccess: (data, variables) => {
      setTotal(data.total);
      if (data.calculation_id) setCalculationId(data.calculation_id);
      
      if (variables.save) {
        toast.success("Kalkulacja prac programistycznych zapisana");
      } else {
        toast.success("Przeliczono prace programistyczne");
      }
    },
    onError: (error) => {
      console.error("Dev calculation error:", error);
      toast.error("Błąd podczas obliczeń prac programistycznych");
    }
  });

  return { 
    rows, 
    total, 
    calculationId, 
    addRow, 
    removeRow, 
    updateRow, 
    calculateMutation,
    isCalculating: calculateMutation.isPending
  };
}
