import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

export function TranscriptConfig() {
  const { currentWorkspace: workspace } = useWorkspace();
  const [model, setModel] = useState("whisper-1");
  const [language, setLanguage] = useState("pl");
  const [diarize, setDiarize] = useState(true);
  const [timestamps, setTimestamps] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (workspace?.id) {
      const fetchPrompt = async () => {
        const { data } = await supabase
          .from("ai_prompts")
          .select("prompt_text")
          .eq("workspace_id", workspace.id)
          .eq("module", "transcription")
          .single();
        
        if (data) setPrompt(data.prompt_text);
      };
      fetchPrompt();
    }
  }, [workspace?.id]);

  const savePrompt = async () => {
    if (!workspace?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ai_prompts")
        .upsert({
          workspace_id: workspace.id,
          module: "transcription",
          prompt_text: prompt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'workspace_id,module' });

      if (error) throw error;
      toast.success("Prompt zapisany");
      setIsOpen(false);
    } catch (err) {
      console.error("Save prompt error:", err);
      toast.error("Błąd podczas zapisywania promptu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Konfiguracja
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Prompt i Styl
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Prompt i Styl Transkrypcji</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Instrukcje dla AI</Label>
                <Textarea
                  id="prompt"
                  placeholder="Opisz styl, branżę, mówców (np. Jan Kowalski - Prowadzący, Anna Nowak - Klient)..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <Button onClick={savePrompt} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Zapisz Prompt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whisper-1">Whisper v1</SelectItem>
              <SelectItem value="whisper-large">Whisper Large</SelectItem>
              <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Język</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pl">Polski</SelectItem>
              <SelectItem value="en">Angielski</SelectItem>
              <SelectItem value="auto">Auto-detekcja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs cursor-pointer" htmlFor="diarize">Rozpoznawanie mówców</Label>
          <Switch id="diarize" checked={diarize} onCheckedChange={setDiarize} />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs cursor-pointer" htmlFor="timestamps">Znaczniki czasu</Label>
          <Switch id="timestamps" checked={timestamps} onCheckedChange={setTimestamps} />
        </div>
      </CardContent>
    </Card>
  );
}
