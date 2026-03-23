// src/pages/Podcast.tsx
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { usePodcastEpisode } from "@/hooks/usePodcast";
import { PodcastForm } from "@/components/podcast/PodcastForm";
import { PodcastSegments } from "@/components/podcast/PodcastSegments";
import { PodcastScript } from "@/components/podcast/PodcastScript";
import { Button } from "@/components/ui/button";
import { History, LayoutGrid, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePodcastEpisodes } from "@/hooks/usePodcast";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function PodcastPage() {
  const { t } = useI18n();
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const { data: episode, isLoading: isEpisodeLoading } = usePodcastEpisode(episodeId);
  const { data: history } = usePodcastEpisodes();

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Left Column: 320px (PodcastForm) */}
      <div className="w-[320px] shrink-0 h-full">
        <PodcastForm onGenerated={setEpisodeId} />
      </div>

      {/* Middle Column: flex-1 (PodcastSegments) */}
      <div className="flex-1 h-full border-r border-border">
        <PodcastSegments 
          segments={episode?.segments || []} 
          isLoading={isEpisodeLoading} 
        />
      </div>

      {/* Right Column: 380px (PodcastScript) */}
      <div className="w-[380px] shrink-0 h-full relative">
        <PodcastScript 
          episodeId={episodeId} 
          initialScript={episode?.full_script || ""} 
        />

        {/* Floating History Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-background border-primary text-primary hover:bg-primary hover:text-white transition-all"
            >
              <History className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px]">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4" />
                Historia odcinków
              </SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-3 overflow-y-auto h-[calc(100vh-80px)]">
              {history?.map((ep) => (
                <div 
                  key={ep.id} 
                  className={`p-3 rounded-lg border border-border cursor-pointer transition-colors hover:bg-muted/50 ${episodeId === ep.id ? 'bg-muted border-primary' : ''}`}
                  onClick={() => setEpisodeId(ep.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xs font-bold truncate flex-1 mr-2">{ep.title}</h3>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {format(new Date(ep.created_at), "dd.MM HH:mm", { locale: pl })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {ep.style}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {ep.duration_minutes} min
                    </span>
                  </div>
                </div>
              ))}
              {!history?.length && (
                <p className="text-xs text-center text-muted-foreground py-12">Brak historii odcinków.</p>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
