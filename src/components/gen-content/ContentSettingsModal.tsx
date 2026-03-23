// src/components/gen-content/ContentSettingsModal.tsx
import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useContentSettings } from "@/hooks/useGenContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface ContentSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TONES = ["Profesjonalny", "Przyjazny", "Edukacyjny", "Sprzedażowy", "Inspirujący"];
const GOALS = ["Edukacja", "Sprzedaż", "Promocja Produktu", "Informacje ogólne", "Zaproszenie na Podcast", "Materiały promocyjne", "Rolki/Reels"];
const LANGUAGES = [
  { value: "pl", label: "Polski" },
  { value: "en", label: "Angielski" },
  { value: "de", label: "Niemiecki" },
  { value: "fr", label: "Francuski" },
  { value: "es", label: "Hiszpański" },
];

export function ContentSettingsModal({ open, onOpenChange }: ContentSettingsModalProps) {
  const { t } = useI18n();
  const { data: settings, updateSettings, isPending: isUpdating } = useContentSettings();
  
  const [tone, setTone] = useState("Profesjonalny");
  const [goal, setGoal] = useState("Edukacja");
  const [language, setLanguage] = useState("pl");
  const [temp, setTemp] = useState(0.7);

  useEffect(() => {
    if (settings) {
      setTone(settings.default_tone);
      setGoal(settings.default_goal);
      setLanguage(settings.language);
      setTemp(settings.temperature);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      default_tone: tone,
      default_goal: goal,
      language: language,
      temperature: temp
    }, {
      onSuccess: () => {
        toast.success(t("common.saved"));
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("gen_content.settings")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs">Domyślny Ton</Label>
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
            <Label className="text-xs">Domyślny Cel</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Język generowania</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Kreatywność (Temperature)</Label>
              <span className="text-xs font-mono text-primary">{temp.toFixed(1)}</span>
            </div>
            <Slider
              value={[temp]}
              onValueChange={([v]) => setTemp(v)}
              min={0}
              max={1}
              step={0.1}
              className="py-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
