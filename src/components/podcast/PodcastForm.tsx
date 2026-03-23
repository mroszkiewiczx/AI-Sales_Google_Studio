// src/components/podcast/PodcastForm.tsx
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { usePodcastGenerate, usePodcastGenerateTitle } from "@/hooks/usePodcast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Mic } from "lucide-react";
import { toast } from "sonner";

interface PodcastFormProps {
  onGenerated: (episodeId: string) => void;
}

export function PodcastForm({ onGenerated }: PodcastFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("solo");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [segmentsCount, setSegmentsCount] = useState("5");
  const [hostName, setHostName] = useState("");
  const [guestName, setGuestName] = useState("");

  const { mutate: generateTitle, isPending: isGeneratingTitle } = usePodcastGenerateTitle();
  const { mutate: generatePodcast, isPending: isGeneratingPodcast } = usePodcastGenerate();

  const handleGenerateTitle = () => {
    generateTitle(description, {
      onSuccess: (data) => {
        setTitle(data.titles[0]);
        toast.success("Wygenerowano propozycje tytułów!");
      }
    });
  };

  const handleGenerate = () => {
    if (!title) {
      toast.error("Podaj tytuł odcinka");
      return;
    }
    generatePodcast({
      title,
      style,
      description,
      duration_minutes: parseInt(duration),
      segments_count: parseInt(segmentsCount),
      host_name: hostName,
      guest_name: guestName
    }, {
      onSuccess: (data) => {
        onGenerated(data.episode_id);
        toast.success("Skrypt podcastu wygenerowany!");
      },
      onError: (err) => {
        toast.error(`Błąd: ${err.message}`);
      }
    });
  };

  const showHostGuest = style === 'wywiad_edukacyjny_2_osoby';
  const isInterview = style === 'wywiad' || style === 'panel';

  return (
    <Card className="h-full border-0 rounded-none border-r border-border bg-muted/30">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Ustawienia odcinka
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="space-y-2">
          <Label className="text-xs">{t("podcast.episode_title")}</Label>
          <div className="flex gap-2">
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Tytuł odcinka..."
              className="h-8 text-xs"
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 shrink-0" 
              onClick={handleGenerateTitle}
              disabled={isGeneratingTitle}
            >
              {isGeneratingTitle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{t("podcast.style")}</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">{t("podcast.styles.solo")}</SelectItem>
              <SelectItem value="wywiad">{t("podcast.styles.wywiad")}</SelectItem>
              <SelectItem value="panel">{t("podcast.styles.panel")}</SelectItem>
              <SelectItem value="storytelling">{t("podcast.styles.storytelling")}</SelectItem>
              <SelectItem value="qa">{t("podcast.styles.qa")}</SelectItem>
              <SelectItem value="wywiad_edukacyjny_2_osoby">{t("podcast.styles.wywiad_edukacyjny_2")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{t("podcast.description")}</Label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder={t("podcast.description_placeholder")}
            className="text-xs min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">{t("podcast.duration")}</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
                <SelectItem value="90">90 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("podcast.segments_count")}</Label>
            <Select value={segmentsCount} onValueChange={setSegmentsCount}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showHostGuest && (
          <div className="space-y-2">
            <Label className="text-xs">{t("podcast.host_name")}</Label>
            <Input 
              value={hostName} 
              onChange={(e) => setHostName(e.target.value)} 
              placeholder="Imię i Nazwisko..."
              className="h-8 text-xs"
            />
          </div>
        )}

        {(showHostGuest || isInterview) && (
          <div className="space-y-2">
            <Label className="text-xs">{t("podcast.guest_name")}</Label>
            <Input 
              value={guestName} 
              onChange={(e) => setGuestName(e.target.value)} 
              placeholder="Imię i Nazwisko..."
              className="h-8 text-xs"
            />
          </div>
        )}

        <Button 
          className="w-full gap-2" 
          onClick={handleGenerate}
          disabled={isGeneratingPodcast}
        >
          {isGeneratingPodcast ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {t("podcast.generate")}
        </Button>
      </CardContent>
    </Card>
  );
}
