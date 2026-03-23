// src/pages/CompBrief.tsx
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useCompetitors, CompetitorTracking } from "@/hooks/useCompBrief";
import { AddCompetitorForm } from "@/components/comp-brief/AddCompetitorForm";
import { CompetitorCard } from "@/components/comp-brief/CompetitorCard";
import { CompetitorResultsSheet } from "@/components/comp-brief/CompetitorResultsSheet";
import { Search, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CompBriefPage() {
  const { t } = useI18n();
  const { data: competitors, isLoading, error } = useCompetitors();
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorTracking | null>(null);

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Left Column: 320px (AddCompetitorForm) */}
      <div className="w-[320px] shrink-0 h-full">
        <AddCompetitorForm />
      </div>

      {/* Right Column: flex-1 (CompetitorList) */}
      <div className="flex-1 h-full flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t("comp_brief.title")}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-bold text-primary uppercase tracking-wider">Monitoring konkurencji AI</AlertTitle>
            <AlertDescription className="text-xs text-foreground/80 leading-relaxed">
              System automatycznie monitoruje zmiany na stronach konkurencji, nowe artykuły, posty w social media oraz oferty pracy. 
              Kliknij "Analizuj teraz", aby wymusić natychmiastowe sprawdzenie najnowszych danych.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm">Ładowanie listy konkurentów...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-destructive text-center">
              {t("common.error")}: {(error as Error).message}
            </div>
          ) : !competitors?.length ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-12 text-center border-2 border-dashed border-border rounded-xl">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-bold">{t("comp_brief.no_competitors")}</p>
              <p className="text-xs">Dodaj pierwszą firmę po lewej, aby rozpocząć monitoring.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {competitors.map((competitor) => (
                <CompetitorCard 
                  key={competitor.id} 
                  competitor={competitor} 
                  onViewDetails={setSelectedCompetitor}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Sheet */}
      <CompetitorResultsSheet 
        competitor={selectedCompetitor} 
        onOpenChange={(open) => !open && setSelectedCompetitor(null)} 
      />
    </div>
  );
}
