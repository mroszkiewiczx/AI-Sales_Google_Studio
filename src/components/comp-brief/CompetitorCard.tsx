// src/components/comp-brief/CompetitorCard.tsx
import { useI18n } from "@/contexts/I18nContext";
import { CompetitorTracking, useAnalyzeCompetitor, useDeleteCompetitor } from "@/hooks/useCompBrief";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, ExternalLink, Clock, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";

interface CompetitorCardProps {
  competitor: CompetitorTracking;
  onViewDetails: (competitor: CompetitorTracking) => void;
}

export function CompetitorCard({ competitor, onViewDetails }: CompetitorCardProps) {
  const { t } = useI18n();
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeCompetitor();
  const { mutate: deleteCompetitor } = useDeleteCompetitor();

  const lastResult = competitor.competitor_results?.[0];

  const handleAnalyze = () => {
    analyze(competitor.id, {
      onSuccess: () => {
        toast.success(`Analiza dla ${competitor.competitor_name} zakończona!`);
      },
      onError: (err) => {
        toast.error(`Błąd analizy: ${err.message}`);
      }
    });
  };

  const handleDelete = () => {
    if (confirm(`Czy na pewno chcesz przestać śledzić ${competitor.competitor_name}?`)) {
      deleteCompetitor(competitor.id);
    }
  };

  return (
    <Card className="shadow-sm border-border overflow-hidden hover:border-primary/50 transition-colors group">
      <CardHeader className="p-4 bg-muted/30 border-b border-border flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {competitor.competitor_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              {competitor.competitor_name}
              {competitor.competitor_url && (
                <a href={competitor.competitor_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {competitor.industry || 'Brak branży'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {t("comp_brief.last_analyzed")}: {competitor.last_analyzed_at ? format(new Date(competitor.last_analyzed_at), "dd.MM.yyyy HH:mm", { locale: pl }) : 'Nigdy'}
          </div>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal">
            {t(`comp_brief.frequency.${competitor.monitoring_frequency}`)}
          </Badge>
        </div>

        {lastResult ? (
          <div className="space-y-3">
            <p className="text-xs text-foreground/80 line-clamp-2 italic bg-muted/20 p-2 rounded border border-border/50">
              "{lastResult.summary}"
            </p>
            <div className="flex gap-2">
              {lastResult.articles?.length > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                  {lastResult.articles.length} {t("comp_brief.articles")}
                </Badge>
              )}
              {lastResult.pricing_changes?.length > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-200">
                  {t("comp_brief.pricing_changes")}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground py-4 text-center italic">
            Brak wyników analizy. Kliknij "Analizuj teraz".
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1 h-8 text-xs gap-2" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {t("comp_brief.analyze_now")}
          </Button>
          <Button 
            variant="outline" 
            className="h-8 text-xs gap-2" 
            onClick={() => onViewDetails(competitor)}
            disabled={!lastResult}
          >
            {t("comp_brief.view_details")}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
