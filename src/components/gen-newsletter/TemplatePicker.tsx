// src/components/gen-newsletter/TemplatePicker.tsx
import { useI18n } from "@/contexts/I18nContext";
import { useNewsletterTemplates, NewsletterTemplate } from "@/hooks/useGenNewsletter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Loader2, Calendar, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface TemplatePickerProps {
  onSelect: (template: NewsletterTemplate) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const { t } = useI18n();
  const { data: templates = [], isLoading } = useNewsletterTemplates();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Zapisane szablony</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3 py-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Brak zapisanych szablonów.
              </div>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => onSelect(tpl)}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{tpl.name}</h3>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tpl.primary_color }} />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(tpl.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
