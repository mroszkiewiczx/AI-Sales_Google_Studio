import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export const TASK_TYPES = ['CALL','EMAIL','LINKED_IN','MEETING','LINKED_IN_CONNECT','LINKED_IN_MESSAGE','TODO','MEETING_GCAL'] as const;
export const TASK_STATUSES = ['NOT_STARTED','IN_PROGRESS','COMPLETED','WAITING','DEFERRED'] as const;
export const TASK_PRIORITIES = ['HIGH','MEDIUM','LOW','NONE'] as const;
export const TASK_TYPE_COLORS: Record<string, string> = {
  CALL: 'blue', EMAIL: 'amber', MEETING: 'green',
  LINKED_IN: 'purple', LINKED_IN_CONNECT: 'purple', LINKED_IN_MESSAGE: 'purple',
  MEETING_GCAL: 'red', TODO: 'gray',
};

export type TaskType = typeof TASK_TYPES[number];
export type TaskStatus = typeof TASK_STATUSES[number];
export type TaskPriority = typeof TASK_PRIORITIES[number];

export interface Task {
  id: string;
  workspace_id: string;
  created_by: string;
  owner_id: string | null;
  account_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  title: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  notes: string | null;
  source: 'app' | 'hubspot' | 'gcal';
  hubspot_task_id: string | null;
  gcal_event_id: string | null;
  created_at: string;
  updated_at: string;
  owner?: { display_name: string };
  account?: { name: string };
  contact?: { name: string; email: string };
}

export interface TaskFilters {
  status?: TaskStatus[];
  task_type?: TaskType[];
  priority?: TaskPriority[];
  owner_id?: string;
  source?: string;
  account_id?: string;
  contact_id?: string;
  due_from?: string;
  due_to?: string;
  date_mode?: 'due' | 'done';
  show_completed?: boolean;
  sort?: 'date' | 'title' | 'priority' | 'client';
  sort_dir?: 'asc' | 'desc';
  client_search?: string;
  contact_search?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  const { currentWorkspace } = useWorkspace();
  return useQuery<{ tasks: Task[]; total: number }>({
    queryKey: ["tasks", currentWorkspace?.id, filters],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("tasks-list", {
        body: { workspace_id: currentWorkspace!.id, ...filters },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!currentWorkspace?.id,
    staleTime: 30_000,
  });
}

export function useSaveTask() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Task> & { workspace_id?: string; task_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("tasks-save", {
        body: { workspace_id: currentWorkspace!.id, ...payload },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentWorkspace?.id] });
    },
  });
}

export function useGCalSync() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("tasks-gcal-sync", {
        body: { workspace_id: currentWorkspace!.id },
      });
      if (error) throw error;
      return data as { synced_count: number; new_count: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentWorkspace?.id] });
    },
  });
}

export function useSaveCallRegistration() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      account_id?: string; contact_id?: string; deal_id?: string;
      called_at: string; duration_seconds?: number;
      outcome: string; direction: string; phone_number?: string; notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("call-registration-save", {
        body: { workspace_id: currentWorkspace!.id, ...payload },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentWorkspace?.id] });
    },
  });
}
