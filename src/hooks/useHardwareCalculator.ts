import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface HardwareItem {
  id: string;
  nazwa: string;
  opis: string;
  cena: number;
  ilosc: number;
  subtotal: number;
}

export const useHardwareCalculator = () => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<HardwareItem[]>([]);
  const [total, setTotal] = useState(0);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("hardware_calc_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setTotal(parsed.total || 0);
      } catch (e) {
        console.error("Failed to parse saved hardware draft", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("hardware_calc_draft", JSON.stringify({ items, total }));
  }, [items, total]);

  const calculateTotal = useCallback((currentItems: HardwareItem[]) => {
    const sum = currentItems.reduce((acc, item) => acc + (item.cena * item.ilosc), 0);
    setTotal(sum);
  }, []);

  const addItem = () => {
    const newItem: HardwareItem = {
      id: crypto.randomUUID(),
      nazwa: "",
      opis: "",
      cena: 0,
      ilosc: 1,
      subtotal: 0,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    calculateTotal(newItems);
  };

  const updateItem = (id: string, updates: Partial<HardwareItem>) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.subtotal = updated.cena * updated.ilosc;
        return updated;
      }
      return item;
    });
    setItems(newItems);
    calculateTotal(newItems);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    calculateTotal(newItems);
  };

  const clearItems = () => {
    setItems([]);
    setTotal(0);
  };

  const calculateMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      const { data, error } = await supabase.functions.invoke("hardware-calculate", {
        body: {
          workspace_id: currentWorkspace.id,
          line_items: items,
          save: true,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware_calculations"] });
    },
  });

  return {
    items,
    total,
    addItem,
    updateItem,
    removeItem,
    clearItems,
    calculate: calculateMutation.mutate,
    isCalculating: calculateMutation.isPending,
  };
};
