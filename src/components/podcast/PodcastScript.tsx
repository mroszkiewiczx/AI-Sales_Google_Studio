// src/components/podcast/PodcastScript.tsx
import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useSavePodcastScript } from "@/hooks/usePodcast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Save, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PodcastScriptProps {
  episodeId: string | null;
  initialScript: string;
}

export function PodcastScript({ episodeId, initialScript }: PodcastScriptProps) {
  const { t } = useI18n();
  const [script, setScript] = useState(initialScript);
  const { mutate: saveScript, isPending: isSaving } = useSavePodcastScript();

  useEffect(() => {
    setScript(initialScript);
  }, [initialScript]);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    toast.success(t("podcast.copy_script"));
  };

  const handleSave = () => {
    if (!episodeId) return;
    saveScript({ id: episodeId, full_script: script }, {
      onSuccess: () => {
        toast.success(t("podcast.save_episode"));
      }
    });
  };

  if (!initialScript && !episodeId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center border-l border-border bg-muted/10">
        <FileText className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">Brak pełnego skryptu.</p>
        <p className="text-xs">Wygeneruj odcinek, aby zobaczyć tekst narracyjny.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-muted/10">
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t("podcast.script_panel")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="default" size="icon" className="h-8 w-8" onClick={handleSave} disabled={isSaving || !episodeId}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <Textarea 
          value={script} 
          onChange={(e) => setScript(e.target.value)} 
          className="h-full w-full resize-none text-xs leading-relaxed font-serif p-4 bg-background border-border shadow-inner"
          placeholder="Tutaj pojawi się pełny skrypt narracyjny..."
        />
      </div>
    </div>
  );
}
