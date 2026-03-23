// src/pages/GenContent.tsx
import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useGenContentGenerate, useGenContentNotionSave, useContentSettings, ContentPost } from "@/hooks/useGenContent";
import { TitleGenerator } from "@/components/gen-content/TitleGenerator";
import { BaseContentEditor } from "@/components/gen-content/BaseContentEditor";
import { ChannelSelector } from "@/components/gen-content/ChannelSelector";
import { ContentParams } from "@/components/gen-content/ContentParams";
import { PostResults } from "@/components/gen-content/PostResults";
import { ContentSettingsModal } from "@/components/gen-content/ContentSettingsModal";
import { Button } from "@/components/ui/button";
import { Settings, History, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GenContentPage() {
  const { t } = useI18n();
  const { data: settings } = useContentSettings();
  const { mutate: generatePosts, isPending: isGenerating } = useGenContentGenerate();
  const { mutate: saveToNotion, isPending: isSavingToNotion } = useGenContentNotionSave();

  // Form State
  const [selectedTitle, setSelectedTitle] = useState("");
  const [baseContent, setBaseContent] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [tone, setTone] = useState("Profesjonalny");
  const [goal, setGoal] = useState("Edukacja");
  const [context, setContext] = useState("");
  const [hashtags, setHashtags] = useState(true);

  // Results State
  const [generationId, setGenerationId] = useState("");
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setTone(settings.default_tone);
      setGoal(settings.default_goal);
      setSelectedChannels(settings.default_channels);
    }
  }, [settings]);

  const handleToggleChannel = (id: string) => {
    setSelectedChannels(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (!selectedTitle) {
      toast.error("Wybierz tytuł przed generowaniem postów");
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error("Wybierz przynajmniej jeden kanał");
      return;
    }

    generatePosts({
      title: selectedTitle,
      base_content: baseContent,
      channels: selectedChannels,
      tone,
      goal,
      context,
      hashtags
    }, {
      onSuccess: (data) => {
        setGenerationId(data.generation_id);
        setPosts(data.posts);
        setSelectedIndices(new Set(data.posts.map((_, i) => i)));
        toast.success("Posty zostały wygenerowane!");
      }
    });
  };

  const handleToggleSelect = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const handleSaveToNotion = () => {
    if (selectedIndices.size === 0) return;
    saveToNotion({
      generation_id: generationId,
      post_indices: Array.from(selectedIndices)
    }, {
      onSuccess: () => {
        toast.success(t("gen_content.saved_to_notion"));
      }
    });
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Left Column: Configuration */}
      <div className="w-full md:w-[420px] border-r border-border bg-muted/20 flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("gen_content.title")}
          </h1>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <TitleGenerator 
              onSelect={setSelectedTitle} 
              selectedTitle={selectedTitle} 
            />
            
            <BaseContentEditor 
              value={baseContent} 
              onChange={setBaseContent} 
            />

            <ChannelSelector 
              selected={selectedChannels} 
              onToggle={handleToggleChannel} 
            />

            <ContentParams 
              tone={tone}
              setTone={setTone}
              goal={goal}
              setGoal={setGoal}
              context={context}
              setContext={setContext}
              hashtags={hashtags}
              setHashtags={setHashtags}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              disabled={!selectedTitle || selectedChannels.length === 0}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Right Column: Results */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <ScrollArea className="flex-1">
          <div className="p-8 max-w-4xl mx-auto w-full">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">{t("gen_content.generating")}</p>
              </div>
            ) : posts.length > 0 ? (
              <PostResults 
                posts={posts}
                generationId={generationId}
                selectedIndices={selectedIndices}
                onToggleSelect={handleToggleSelect}
                onSaveToNotion={handleSaveToNotion}
                isSavingToNotion={isSavingToNotion}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Brak wygenerowanych treści</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Wypełnij formularz po lewej stronie i kliknij "Generuj Posty", aby stworzyć content dla swoich kanałów.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <ContentSettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </div>
  );
}
