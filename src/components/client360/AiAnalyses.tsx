import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, Clock, TrendingUp, AlertTriangle, Lightbulb, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AiAnalyses({ score }: { score: any }) {
  const mockAnalyses = [
    { id: 1, date: "2024-03-20", time: "14:45", type: "Analiza Rozmowy", score: 85, summary: "Bardzo pozytywny sentyment, klient wykazuje duże zainteresowanie modułem automatyzacji.", strengths: ["Zainteresowanie", "Gotowość do zmian"], weaknesses: ["Budżet", "Decyzyjność"], recommendations: ["Przesłać demo automatyzacji"] },
    { id: 2, date: "2024-03-15", time: "10:15", type: "Analiza E-maila", score: 72, summary: "Klient prosi o doprecyzowanie warunków licencyjnych.", strengths: ["Konkretne pytania"], weaknesses: ["Brak decyzji co do liczby licencji"], recommendations: ["Przesłać cennik pakietowy"] }
  ];

  const analyses = score ? [score, ...mockAnalyses] : mockAnalyses;

  return (
    <div className="space-y-4">
      {analyses.map((analysis: any, i: number) => (
        <Card key={i} className="shadow-none border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{analysis.type || "Analiza AI"}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {analysis.date || "2024-03-20"}
                    <Clock className="h-3 w-3 ml-1" />
                    {analysis.time || "14:45"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5 font-bold border-primary text-primary">
                  Score: {analysis.score}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MessageSquare className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-emerald-600 font-bold">
                  <TrendingUp className="h-2.5 w-2.5" />
                  Mocne strony
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.strengths?.slice(0, 2).map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[9px] px-1.5 h-4 font-normal">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-600 font-bold">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Ryzyka
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.weaknesses?.slice(0, 2).map((w: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[9px] px-1.5 h-4 font-normal">{w}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
