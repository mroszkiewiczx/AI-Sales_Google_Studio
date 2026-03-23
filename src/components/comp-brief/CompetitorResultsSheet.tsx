// src/components/comp-brief/CompetitorResultsSheet.tsx
import { useI18n } from "@/contexts/I18nContext";
import { CompetitorTracking } from "@/hooks/useCompBrief";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Newspaper, CreditCard, Share2, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface CompetitorResultsSheetProps {
  competitor: CompetitorTracking | null;
  onOpenChange: (open: boolean) => void;
}

export function CompetitorResultsSheet({ competitor, onOpenChange }: CompetitorResultsSheetProps) {
  const { t } = useI18n();
  const lastResult = competitor?.competitor_results?.[0];

  if (!competitor || !lastResult) return null;

  return (
    <Sheet open={!!competitor} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] p-0 flex flex-col h-full">
        <SheetHeader className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {competitor.competitor_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <SheetTitle className="text-xl font-bold">{competitor.competitor_name}</SheetTitle>
              <p className="text-xs text-muted-foreground">
                Ostatnia analiza: {format(new Date(lastResult.analyzed_at), "dd MMMM yyyy, HH:mm", { locale: pl })}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Podsumowanie AI</h3>
            <p className="text-sm leading-relaxed text-foreground/80 italic">
              "{lastResult.summary}"
            </p>
          </div>

          <Tabs defaultValue="articles" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-10 mb-6">
              <TabsTrigger value="articles" className="text-xs gap-2">
                <Newspaper className="h-3.5 w-3.5" />
                {t("comp_brief.articles")}
              </TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs gap-2">
                <CreditCard className="h-3.5 w-3.5" />
                {t("comp_brief.pricing_changes")}
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs gap-2">
                <Share2 className="h-3.5 w-3.5" />
                {t("comp_brief.social_activity")}
              </TabsTrigger>
              <TabsTrigger value="jobs" className="text-xs gap-2">
                <Briefcase className="h-3.5 w-3.5" />
                {t("comp_brief.job_postings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="space-y-4">
              {lastResult.articles?.map((art: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold flex-1 mr-4">{art.title}</h4>
                    <Badge variant="outline" className={
                      art.sentiment === 'pozytywny' ? 'bg-green-100 text-green-700 border-green-200' :
                      art.sentiment === 'negatywny' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }>
                      {t(`comp_brief.sentiment.${art.sentiment}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{art.snippet}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{art.published_at || 'Brak daty'}</span>
                    <a href={art.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                      Czytaj więcej <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              ))}
              {!lastResult.articles?.length && <p className="text-xs text-center py-12 text-muted-foreground">Brak artykułów.</p>}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              {lastResult.pricing_changes?.map((pc: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border border-amber-200 bg-amber-50/30">
                  <h4 className="text-sm font-bold mb-2">{pc.description}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Wykryto: {pc.detected_at || 'Brak daty'}</span>
                    {pc.url && (
                      <a href={pc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                        Źródło <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {!lastResult.pricing_changes?.length && <p className="text-xs text-center py-12 text-muted-foreground">Brak wykrytych zmian cen.</p>}
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              {lastResult.social_activity?.map((sa: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{sa.platform}</Badge>
                    <span className="text-[10px] text-muted-foreground">{sa.engagement || 'Brak danych o zaangażowaniu'}</span>
                  </div>
                  <p className="text-xs mb-3">{sa.content}</p>
                  {sa.url && (
                    <a href={sa.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                      Zobacz post <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              ))}
              {!lastResult.social_activity?.length && <p className="text-xs text-center py-12 text-muted-foreground">Brak aktywności w social media.</p>}
            </TabsContent>

            <TabsContent value="jobs" className="space-y-4">
              {lastResult.job_postings?.map((job: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border border-border flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold">{job.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{job.location || 'Zdalnie'}</span>
                  </div>
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
              {!lastResult.job_postings?.length && <p className="text-xs text-center py-12 text-muted-foreground">Brak ofert pracy.</p>}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
