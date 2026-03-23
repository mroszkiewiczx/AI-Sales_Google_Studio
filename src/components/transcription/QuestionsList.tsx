import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const mockQuestions = [
  { id: 1, text: "Jakie są główne cele biznesowe klienta?", answered: true },
  { id: 2, text: "Czy klient posiada już system CRM?", answered: true },
  { id: 3, text: "Jaki jest budżet na wdrożenie?", answered: false },
  { id: 4, text: "Kto podejmuje ostateczną decyzję zakupową?", answered: false },
  { id: 5, text: "Kiedy planowane jest rozpoczęcie projektu?", answered: false }
];

export function QuestionsList() {
  const [questions, setQuestions] = useState(mockQuestions);

  const toggleAnswered = (id: number) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, answered: !q.answered } : q));
  };

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Lista Pytań i Odpowiedzi
        </CardTitle>
        <div className="text-[10px] text-muted-foreground font-mono">
          Postęp: {questions.filter(q => q.answered).length}/{questions.length}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="h-[250px] pr-4">
          <div className="space-y-2 py-4">
            {questions.map((q) => (
              <div 
                key={q.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border border-border/50 text-xs transition-colors cursor-pointer ${q.answered ? 'bg-muted/30 opacity-70' : 'bg-background hover:border-primary/50'}`}
                onClick={() => toggleAnswered(q.id)}
              >
                {q.answered ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <span className={q.answered ? 'line-through' : ''}>{q.text}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
