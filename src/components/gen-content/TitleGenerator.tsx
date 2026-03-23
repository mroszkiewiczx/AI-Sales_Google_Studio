// src/components/gen-content/TitleGenerator.tsx
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useGenContentTitles } from "@/hooks/useGenContent";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TitleGeneratorProps {
  onSelect: (title: string) => void;
  selectedTitle: string;
}

export function TitleGenerator({ onSelect, selectedTitle }: TitleGeneratorProps) {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const { mutate: generateTitles, isPending } = useGenContentTitles();

  const handleGenerate = () => {
    if (!input.trim()) return;
    generateTitles({ title_or_url: input }, {
      onSuccess: (data) => setTitles(data.titles)
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("gen_content.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={t("gen_content.title_placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-9"
          />
          <Button 
            size="sm" 
            onClick={handleGenerate} 
            disabled={isPending || !input.trim()}
            className="shrink-0"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("gen_content.generate_titles")}
          </Button>
        </div>

        {titles.length > 0 && (
          <div className="grid gap-2">
            {titles.map((title, idx) => (
              <div
                key={idx}
                onClick={() => onSelect(title)}
                className={cn(
                  "p-3 rounded-lg border text-sm cursor-pointer transition-all flex items-start gap-3",
                  selectedTitle === title 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                  selectedTitle === title ? "border-primary bg-primary text-white" : "border-muted-foreground"
                )}>
                  {selectedTitle === title && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <span className="leading-tight">{title}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
