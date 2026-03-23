import * as React from "react";
import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useSaveTask, Task, TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES } from "@/hooks/useTasks";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
}

export function TaskDrawer({ open, onOpenChange, taskId }: Props) {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const saveTask = useSaveTask();
  
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    task_type: "TODO",
    status: "NOT_STARTED",
    priority: "NONE",
    due_date: new Date().toISOString().split('T')[0],
    due_time: "12:00",
    notes: "",
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (open && taskId) {
      supabase.from("tasks").select("*").eq("id", taskId).single().then(({ data }) => {
        if (data) setFormData(data as any);
      });
    } else if (open && !taskId) {
      setFormData({
        title: "",
        task_type: "TODO",
        status: "NOT_STARTED",
        priority: "NONE",
        due_date: new Date().toISOString().split('T')[0],
        due_time: "12:00",
        notes: "",
      });
    }
  }, [open, taskId]);

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
    if (!formData.title || !formData.task_type || !formData.status) {
      toast.error(t("common.error"));
      return;
    }

    try {
      await saveTask.mutateAsync({ ...formData, task_id: taskId || undefined } as any);
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
          <SheetTitle>{taskId ? "Edytuj zadanie" : t("tasks.newTask")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Tytuł *</Label>
            <Input 
              value={formData.title || ""} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ *</Label>
              <Select value={formData.task_type} onValueChange={v => setFormData({ ...formData, task_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input 
                type="date" 
                value={formData.due_date || ""} 
                onChange={e => setFormData({ ...formData, due_date: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Godzina</Label>
              <Input 
                type="time" 
                value={formData.due_time || ""} 
                onChange={e => setFormData({ ...formData, due_time: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priorytet</Label>
            <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
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
              value={formData.notes || ""} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })} 
              rows={4} 
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={saveTask.isPending} className="w-full">
              {saveTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
