// src/hooks/useClient360.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAccountSearch(searchTerm: string, workspaceId?: string) {
  return useQuery({
    queryKey: ["accounts", "search", searchTerm, workspaceId],
    queryFn: async () => {
      if (!workspaceId || searchTerm.length < 2) return [];
      
      const { data, error } = await (supabase as any)
        .from("accounts")
        .select("*")
        .eq("workspace_id", workspaceId)
        .ilike("name", `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId && searchTerm.length >= 2,
  });
}

export function useClient360(accountId?: string, workspaceId?: string) {
  return useQuery({
    queryKey: ["client360", accountId, workspaceId],
    queryFn: async () => {
      if (!accountId || !workspaceId) return null;
      
      const { data, error } = await supabase.functions.invoke("client360-get", {
        body: { account_id: accountId, workspace_id: workspaceId },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!accountId && !!workspaceId,
  });
}

export function useClient360Score(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId }: { accountId: string }) => {
      if (!workspaceId) throw new Error("Workspace ID required");

      const { data, error } = await supabase.functions.invoke("client360-score", {
        body: { account_id: accountId, workspace_id: workspaceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ["client360", accountId] });
      toast.success("Scoring wygenerowany pomyślnie");
    },
    onError: (error) => {
      console.error("Scoring error:", error);
      toast.error("Błąd podczas generowania scoringu");
    },
  });
}
