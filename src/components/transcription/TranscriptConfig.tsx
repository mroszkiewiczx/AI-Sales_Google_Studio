import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function TranscriptConfig() {
  const [model, setModel] = useState("whisper-1");
  const [language, setLanguage] = useState("pl");
  const [diarize, setDiarize] = useState(true);
  const [timestamps, setTimestamps] = useState(true);
  const [prompt, setPrompt] = useState("");

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Konfiguracja
        </CardTitle>
        <Dialog>
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
                  placeholder="Np. Usuń przerywniki, sformatuj jako dialog, zachowaj styl biznesowy..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <Button onClick={() => console.log("Save prompt to Firestore", prompt)}>Zapisz Prompt</Button>
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
