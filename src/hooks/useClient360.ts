import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, limit } from "firebase/firestore";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useQuery } from "@tanstack/react-query";

export function useAccountSearch(searchTerm: string) {
  const { currentWorkspace } = useWorkspace();

  return useQuery({
    queryKey: ["accounts", currentWorkspace?.id, searchTerm],
    queryFn: async () => {
      if (!currentWorkspace || !searchTerm) return [];
      
      const q = query(
        collection(db, "workspaces", currentWorkspace.id, "accounts"),
        where("name", ">=", searchTerm),
        where("name", "<=", searchTerm + "\uf8ff"),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!currentWorkspace && searchTerm.length > 2
  });
}

export function useClient360(accountId: string | undefined) {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace || !accountId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch account details
    const accountRef = doc(db, "workspaces", currentWorkspace.id, "accounts", accountId);
    
    const unsubscribe = onSnapshot(accountRef, async (snapshot) => {
      if (snapshot.exists()) {
        const accountData = { id: snapshot.id, ...snapshot.data() };
        
        // Fetch contacts
        const contactsQ = query(collection(db, "workspaces", currentWorkspace.id, "contacts"), where("accountId", "==", accountId));
        const contactsSnap = await getDocs(contactsQ);
        const contacts = contactsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Fetch deals
        const dealsQ = query(collection(db, "workspaces", currentWorkspace.id, "deals"), where("accountId", "==", accountId));
        const dealsSnap = await getDocs(dealsQ);
        const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Fetch score
        const scoreQ = query(collection(db, "workspaces", currentWorkspace.id, "client360_scores"), where("accountId", "==", accountId), limit(1));
        const scoreSnap = await getDocs(scoreQ);
        const score = scoreSnap.docs[0]?.data() || null;

        setData({
          account: accountData,
          contacts,
          deals,
          score,
          history: {
            calls: [],
            emails: [],
            tasks: []
          }
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentWorkspace, accountId]);

  return { data, loading };
}

export function useClient360Score(accountId: string | undefined) {
  const { currentWorkspace } = useWorkspace();

  const generateScore = async () => {
    if (!currentWorkspace || !accountId) return;
    
    // Mocking AI scoring logic
    console.log("Generating AI score for account:", accountId);
    toast.info("Generowanie analizy AI...");
    
    // In a real app, this would call a Cloud Function
    setTimeout(() => {
      toast.success("Analiza zakończona");
    }, 2000);
  };

  return { generateScore };
}

import { toast } from "sonner";
