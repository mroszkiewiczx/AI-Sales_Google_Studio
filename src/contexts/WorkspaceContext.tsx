import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./AuthContext";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  ownerId: string;
  members: string[];
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (ws: Workspace) => void;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Query workspaces where user is a member
    const q = query(collection(db, "workspaces"), where("members", "array-contains", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wsList: Workspace[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Workspace));

      setWorkspaces(wsList);
      
      const savedSlug = localStorage.getItem("salesos_workspace");
      const saved = wsList.find(w => w.slug === savedSlug);
      setCurrentWorkspace(saved || wsList[0] || null);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching workspaces:", error);
      setLoading(false);
      
      // If no workspace exists for this specific user (e.g. mroszkiewicz), create one
      if (user.email === "mroszkiewicz@optimakers.pl") {
        setupInitialWorkspace(user.uid);
      }
    });

    const setupInitialWorkspace = async (uid: string) => {
      try {
        const wsId = "optimakers-ws";
        const wsData = {
          name: "Optimakers",
          slug: "optimakers",
          ownerId: uid,
          members: [uid],
          settings: {},
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "workspaces", wsId), wsData);
      } catch (err) {
        console.error("Failed to setup initial workspace:", err);
      }
    };

    return () => unsubscribe();
  }, [user]);

  const handleSetWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    localStorage.setItem("salesos_workspace", ws.slug);
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces, currentWorkspace, setCurrentWorkspace: handleSetWorkspace, loading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
