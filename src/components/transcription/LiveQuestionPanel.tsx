import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const mockQuestions = [
  "Jakie są główne cele biznesowe klienta?",
  "Czy klient posiada już system CRM?",
  "Jaki jest budżet na wdrożenie?",
  "Kto podejmuje ostateczną decyzję zakupową?"
];

export function LiveQuestionPanel() {
  return (
    <Card className="shadow-sm border-border bg-primary/5">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          Sugerowane Pytania (AI)
        </CardTitle>
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-3">
            {mockQuestions.map((q, i) => (
              <div key={i} className="p-3 rounded-lg bg-background border border-border/50 text-xs hover:border-primary/50 transition-colors cursor-pointer">
                {q}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
