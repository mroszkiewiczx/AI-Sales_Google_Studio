import * as React from "react";
import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useSaveCallRegistration } from "@/hooks/useTasks";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallRegistrationDrawer({ open, onOpenChange }: Props) {
  const { t } = useI18n();
  const saveCall = useSaveCallRegistration();
  
  const [formData, setFormData] = useState({
    called_at: new Date().toISOString().substring(0, 16),
    duration_seconds: "",
    outcome: "ANSWERED",
    direction: "OUTBOUND",
    phone_number: "",
    notes: "",
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        called_at: new Date().toISOString().substring(0, 16),
        duration_seconds: "",
        outcome: "ANSWERED",
        direction: "OUTBOUND",
        phone_number: "",
        notes: "",
      });
    }
  }, [open]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'pl-PL';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({ ...prev, notes: (prev.notes ? prev.notes + "\n" : "") + transcript }));
        setIsRecording(false);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop();
    } else {
      recognition?.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCall.mutateAsync({
        ...formData,
        called_at: new Date(formData.called_at).toISOString(),
        duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : undefined,
      });
      toast.success(t("common.saved"));
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("tasks.registerCall")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Data i godzina</Label>
            <Input 
              type="datetime-local" 
              value={formData.called_at} 
              onChange={e => setFormData({ ...formData, called_at: e.target.value })} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kierunek</Label>
              <Select value={formData.direction} onValueChange={v => setFormData({ ...formData, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTBOUND">Wychodzące</SelectItem>
                  <SelectItem value="INBOUND">Przychodzące</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wynik</Label>
              <Select value={formData.outcome} onValueChange={v => setFormData({ ...formData, outcome: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANSWERED">Odebrane</SelectItem>
                  <SelectItem value="NO_ANSWER">Brak odpowiedzi</SelectItem>
                  <SelectItem value="BUSY">Zajęte</SelectItem>
                  <SelectItem value="LEFT_VOICEMAIL">Poczta głosowa</SelectItem>
                  <SelectItem value="WRONG_NUMBER">Zły numer</SelectItem>
                  <SelectItem value="CONNECTED">Połączono</SelectItem>
                  <SelectItem value="LEFT_LIVE_MESSAGE">Zostawiono wiadomość</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Czas trwania (sekundy)</Label>
              <Input 
                type="number" 
                value={formData.duration_seconds} 
                onChange={e => setFormData({ ...formData, duration_seconds: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Numer telefonu</Label>
              <Input 
                type="tel" 
                value={formData.phone_number} 
                onChange={e => setFormData({ ...formData, phone_number: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Notatki</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={toggleRecording}
                className={isRecording ? "text-red-500 animate-pulse" : ""}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isRecording ? "Nagrywanie..." : "Dyktafon"}
              </Button>
            </div>
            <Textarea 
              value={formData.notes} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })} 
              rows={4} 
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={saveCall.isPending} className="w-full">
              {saveCall.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
