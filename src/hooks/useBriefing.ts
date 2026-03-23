import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc } from "firebase/firestore";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";

export interface KeyAlert { type: 'red'|'yellow'|'green'|'blue'; text: string; }
export interface HistoryItem { type: 'email'|'call'|'note'; date: string; summary: string; }
export interface BriefingQuestion { id: string; text: string; answered: boolean; }

export interface MeetingBrief {
  id: string;
  workspace_id: string;
  account_id: string | null;
  calendar_event_id: string | null;
  meeting_title: string | null;
  meeting_time: string | null;
  contact_name: string | null;
  contact_email: string | null;
  mode: 'auto' | 'manual';
  bant_total: number | null;
  brief_content: {
    company_info?: string;
    deal_stage?: string;
    deal_value?: number;
    summary?: string;
    key_points?: string[];
    risks?: string[];
  };
  questions: BriefingQuestion[];
  key_alerts: KeyAlert[];
  history_summary: HistoryItem[];
  email_sent_at: string | null;
  created_at: string;
}

export function useBriefings(date?: string) {
  const { currentWorkspace } = useWorkspace();
  return useQuery<MeetingBrief[]>({
    queryKey: ["briefings", currentWorkspace?.id, date],
    queryFn: async () => {
      const q = query(
        collection(db, `workspaces/${currentWorkspace!.id}/meeting_briefs`),
        orderBy("meeting_time", "asc")
      );
      
      const snapshot = await getDocs(q);
      let briefs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MeetingBrief));
        
      if (date) {
        briefs = briefs.filter(b => b.meeting_time?.startsWith(date));
      }
        
      return briefs;
    },
    enabled: !!currentWorkspace?.id,
  });
}

export function useGenerateBriefingAuto() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date?: string) => {
      console.log("Mock: Generating auto briefing for", date);
      return { briefs: [], synced_count: 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefings", currentWorkspace?.id] });
    },
  });
}

export function useGenerateBriefingManual() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { query?: string; paste_text?: string; account_id?: string }) => {
      console.log("Mock: Generating manual briefing", params);
      return { brief: {} as MeetingBrief };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefings", currentWorkspace?.id] });
    },
  });
}

export function useSendBriefingEmail() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { brief_id: string; recipient_email?: string }) => {
      console.log("Mock: Sending briefing email", params);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefings", currentWorkspace?.id] });
    },
  });
}

export function useBriefingSettings() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  return useQuery({
    queryKey: ["briefing-settings", currentWorkspace?.id, user?.uid],
    queryFn: async () => {
      const docRef = doc(db, `workspaces/${currentWorkspace!.id}/briefing_settings`, user!.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    enabled: !!currentWorkspace?.id && !!user?.uid,
  });
}

export function useSaveBriefingSettings() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: any) => {
      if (!user) throw new Error("Not authenticated");
      const docRef = doc(db, `workspaces/${currentWorkspace!.id}/briefing_settings`, user.uid);
      await setDoc(docRef, settings, { merge: true });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefing-settings", currentWorkspace?.id] });
    },
  });
}
