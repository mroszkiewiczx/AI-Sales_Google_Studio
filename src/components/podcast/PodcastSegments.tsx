// src/components/podcast/PodcastSegments.tsx
import { useI18n } from "@/contexts/I18nContext";
import { PodcastSegment } from "@/hooks/usePodcast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Clock, ListChecks, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PodcastSegmentsProps {
  segments: PodcastSegment[];
  isLoading?: boolean;
}

export function PodcastSegments({ segments, isLoading }: PodcastSegmentsProps) {
  const { t } = useI18n();

  const handleCopy = () => {
    const text = segments.map((s, i) => {
      return `Segment ${i + 1}: ${s.title} (${s.duration_min} min)\n\nPYTANIA:\n${s.questions.join('\n')}\n\nTREŚĆ:\n${s.content.join('\n')}`;
    }).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success(t("podcast.copy_segments"));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="h-32 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!segments.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center">
        <ListChecks className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">Brak wygenerowanych segmentów.</p>
        <p className="text-xs">Skonfiguruj odcinek po lewej i kliknij "Generuj Skrypt".</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          {t("podcast.segments_panel")}
        </h2>
        <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
          {t("podcast.copy_segments")}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {segments.map((segment, idx) => (
          <Card key={idx} className="shadow-sm border-border">
            <CardHeader className="p-4 bg-muted/30 border-b border-border flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold">
                Segment {idx + 1}: {segment.title}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <Clock className="h-3.5 w-3.5" />
                {segment.duration_min} min
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  {t("podcast.questions")}
                </h3>
                <ul className="space-y-2">
                  {segment.questions.map((q, qIdx) => (
                    <li key={qIdx} className="text-xs flex gap-3 p-2 rounded bg-muted/20 border border-border/50">
                      <span className="font-bold text-primary shrink-0">{qIdx + 1}.</span>
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5" />
                  {t("podcast.content")}
                </h3>
                <div className="space-y-3">
                  {segment.content.map((c, cIdx) => (
                    <p key={cIdx} className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                      {c}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
