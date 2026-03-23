import { useQuery } from "@tanstack/react-query";
import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useState } from "react";

export interface DealRow {
  id: string; title: string; stage: string;
  amount: number;
  ownerId: string;
  workspaceId: string;
  createdAt: any;
  updatedAt: any;
}

export interface DealsResponse {
  data: DealRow[]; total: number; page: number;
  per_page: number; total_pages: number;
}

export interface DealsFilters {
  stages?: string[]; owner_id?: string;
}

export function useDashboardDeals() {
  const { currentWorkspace } = useWorkspace();
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<DealsFilters>({});

  const queryResult = useQuery<DealsResponse>({
    queryKey: ["dashboard-deals", currentWorkspace?.id, page, perPage, sortBy, sortDir, filters],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const q = query(
        collection(db, `workspaces/${currentWorkspace!.id}/deals`),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      let deals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DealRow));

      // Client side filtering
      if (filters.stages?.length) {
        deals = deals.filter(d => filters.stages!.includes(d.stage));
      }
      if (filters.owner_id) {
        deals = deals.filter(d => d.ownerId === filters.owner_id);
      }

      // Client side sorting
      deals.sort((a: any, b: any) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });

      const start = (page - 1) * perPage;
      const paginatedData = deals.slice(start, start + perPage);

      return {
        data: paginatedData,
        total: deals.length,
        page,
        per_page: perPage,
        total_pages: Math.ceil(deals.length / perPage),
      };
    },
  });

  const handleSort = (column: string) => {
    if (sortBy === column) setSortDir(prev => prev === "asc" ? "desc" : "asc");
    else { setSortBy(column); setSortDir("desc"); }
    setPage(1);
  };

  return { ...queryResult, page, setPage, sortBy, sortDir, handleSort, filters, setFilters, perPage };
}
