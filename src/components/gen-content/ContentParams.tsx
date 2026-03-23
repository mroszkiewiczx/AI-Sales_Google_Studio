// src/components/gen-content/ContentParams.tsx
import { useI18n } from "@/contexts/I18nContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Settings2, Loader2 } from "lucide-react";

interface ContentParamsProps {
  tone: string;
  setTone: (v: string) => void;
  goal: string;
  setGoal: (v: string) => void;
  context: string;
  setContext: (v: string) => void;
  hashtags: boolean;
  setHashtags: (v: boolean) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

const TONES = ["Profesjonalny", "Przyjazny", "Edukacyjny", "Sprzedażowy", "Inspirujący"];
const GOALS = ["Edukacja", "Sprzedaż", "Promocja Produktu", "Informacje ogólne", "Zaproszenie na Podcast", "Materiały promocyjne", "Rolki/Reels"];

export function ContentParams({
  tone, setTone, goal, setGoal, context, setContext, hashtags, setHashtags, onGenerate, isGenerating, disabled
}: ContentParamsProps) {
  const { t } = useI18n();

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          {t("gen_content.settings")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">{t("gen_content.tone")}</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("gen_content.goal")}</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Dodatkowy kontekst</Label>
          <Textarea
            placeholder={t("gen_content.context_placeholder")}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[80px] text-xs resize-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hashtags" 
            checked={hashtags} 
            onCheckedChange={(v) => setHashtags(!!v)} 
          />
          <Label htmlFor="hashtags" className="text-xs cursor-pointer">
            {t("gen_content.hashtags")}
          </Label>
        </div>

        <Button 
          className="w-full h-10 gap-2" 
          onClick={onGenerate} 
          disabled={isGenerating || disabled}
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("gen_content.generate_posts")}
        </Button>
      </CardContent>
    </Card>
  );
}
