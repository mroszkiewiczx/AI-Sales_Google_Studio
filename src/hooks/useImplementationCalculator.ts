import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

export interface ImplementationRow {
  id: string; // client-side UUID dla drag&drop
  product_id?: string;
  nazwa: string;
  opis: string;
  model: "Jednorazowo" | "Miesięcznie" | "Rocznie" | "Ratalna" | "Leasing";
  cena: number;
  ilosc: number;
  subtotal?: number;
}

export function useImplementationProducts() {
  const { currentWorkspace } = useWorkspace();
  return useQuery({
    queryKey: ["implementation-products", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("implementation_products")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .eq("is_active", true)
        .order("grupa")
        .order("sort_order");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });
}

export function useImplementationCalculator() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ImplementationRow[]>([]);
  const [results, setResults] = useState<{
    sumaJdn: number; sumaMies: number; sumaRocz: number; calculationId?: string;
  } | null>(null);

  const addRow = useCallback((product?: Partial<ImplementationRow>) => {
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      nazwa: product?.nazwa || "Nowa pozycja",
      opis: product?.opis || "",
      model: product?.model || "Jednorazowo",
      cena: product?.cena || 0,
      ilosc: product?.ilosc || 1,
      product_id: product?.product_id,
    }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, updates: Partial<ImplementationRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const reorderRows = useCallback((fromIdx: number, toIdx: number) => {
    setRows(prev => {
      const newRows = [...prev];
      const [moved] = newRows.splice(fromIdx, 1);
      newRows.splice(toIdx, 0, moved);
      return newRows;
    });
  }, []);

  const clearRows = useCallback(() => {
    setRows([]);
    setResults(null);
  }, []);

  const calculateMutation = useMutation({
    mutationFn: async (params: { save?: boolean; deal_id?: string }) => {
      if (!currentWorkspace?.id) throw new Error("Workspace is required");
      
      const { data, error } = await supabase.functions.invoke("implementation-calculate", {
        body: {
          workspace_id: currentWorkspace.id,
          line_items: rows.map(r => ({ 
            nazwa: r.nazwa, 
            opis: r.opis, 
            model: r.model, 
            cena: r.cena, 
            ilosc: r.ilosc 
          })),
          ...params,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      setResults({
        sumaJdn: data.suma_jdn,
        sumaMies: data.suma_mies,
        sumaRocz: data.suma_rocz,
        calculationId: data.calculation_id,
      });
      
      if (variables.save) {
        toast.success("Kalkulacja zapisana pomyślnie");
      } else {
        toast.success("Przeliczono wdrożenie");
      }
    },
    onError: (error) => {
      console.error("Implementation calculation error:", error);
      toast.error("Błąd podczas obliczeń wdrożenia");
    }
  });

  return { 
    rows, 
    addRow, 
    removeRow, 
    updateRow, 
    reorderRows, 
    clearRows,
    results, 
    calculateMutation,
    isCalculating: calculateMutation.isPending
  };
}
