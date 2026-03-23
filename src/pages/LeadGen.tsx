// src/pages/LeadGen.tsx
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useLeadGenSearch, useLeadGenExport, useImportLeadsToCRM, SearchConfig, LeadResult } from "@/hooks/useLeadGen";
import { SearchForm } from "@/components/lead-gen/SearchForm";
import { ResultsTable } from "@/components/lead-gen/ResultsTable";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LeadGenPage() {
  const { t } = useI18n();
  const [results, setResults] = useState<LeadResult[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const { mutate: search, isPending: isSearching } = useLeadGenSearch();
  const { mutate: exportCsv, isPending: isExporting } = useLeadGenExport();
  const { mutate: importToCrm, isPending: isImporting } = useImportLeadsToCRM();

  const handleSearch = (config: SearchConfig) => {
    search(config, {
      onSuccess: (data) => {
        setResults(data.results);
        setSearchId(data.search_id);
        setSelectedIndices(new Set());
        toast.success(t("lead_gen.results_count", { count: data.results_count }));
      },
      onError: (err: any) => {
        toast.error(err.message || t("common.error"));
      }
    });
  };

  const handleExport = () => {
    if (!searchId) return;
    exportCsv({ 
      search_id: searchId, 
      indices: selectedIndices.size > 0 ? Array.from(selectedIndices) : undefined 
    });
  };

  const handleImport = () => {
    if (selectedIndices.size === 0) {
      toast.error(t("common.select_items"));
      return;
    }
    const selectedLeads = results.filter((_, i) => selectedIndices.has(i));
    importToCrm(selectedLeads, {
      onSuccess: (count) => {
        toast.success(t("common.imported", { count }));
        setSelectedIndices(new Set());
      },
      onError: (err: any) => {
        toast.error(err.message || t("common.error"));
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("lead_gen.title")}</h1>
          <p className="text-muted-foreground">{t("lead_gen.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-6">
          <SearchForm onSearch={handleSearch} isSearching={isSearching} />
        </aside>

        <main className="space-y-6">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 bg-card rounded-xl border border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">{t("lead_gen.searching")}</p>
            </div>
          ) : results.length > 0 ? (
            <ResultsTable 
              results={results} 
              selectedIndices={selectedIndices}
              onToggleSelect={(i) => {
                const next = new Set(selectedIndices);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                setSelectedIndices(next);
              }}
              onSelectAll={(all) => {
                if (all) setSelectedIndices(new Set(results.keys()));
                else setSelectedIndices(new Set());
              }}
              onExport={handleExport}
              onImport={handleImport}
              isExporting={isExporting}
              isImporting={isImporting}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 bg-card rounded-xl border border-dashed">
              <p className="text-muted-foreground">{t("lead_gen.no_results")}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
