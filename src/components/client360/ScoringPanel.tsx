import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClient360Score } from "@/hooks/useClient360";
import { motion } from "motion/react";

export function ScoringPanel({ score, accountId }: { score: any, accountId: string }) {
  const { generateScore } = useClient360Score(accountId);
  const currentScore = score?.score || 0;

  return (
    <Card className="shadow-sm border-border bg-primary/5">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Scoring AI 360°
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={generateScore}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-6">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative h-32 w-32">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle
                className="text-muted-foreground/20 stroke-current"
                strokeWidth="8"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              />
              <motion.circle
                className="text-primary stroke-current"
                strokeWidth="8"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                initial={{ strokeDasharray: "0 251.2" }}
                animate={{ strokeDasharray: `${(currentScore / 100) * 251.2} 251.2` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{currentScore}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</span>
            </div>
          </div>
        </div>

        {score ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Podsumowanie</p>
              <p className="text-xs leading-relaxed">{score.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                  <TrendingUp className="h-3 w-3" />
                  Mocne strony
                </div>
                <ul className="space-y-1">
                  {score.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-[10px] flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-600 font-bold">
                  <AlertTriangle className="h-3 w-3" />
                  Ryzyka
                </div>
                <ul className="space-y-1">
                  {score.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="text-[10px] flex items-start gap-1">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary font-bold">
                <Lightbulb className="h-3 w-3" />
                Rekomendacje
              </div>
              <ul className="space-y-1">
                {score.recommendations.map((r: string, i: number) => (
                  <li key={i} className="text-[10px] flex items-start gap-1">
                    <span className="text-primary mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-muted-foreground italic">Brak aktualnej analizy AI dla tego klienta.</p>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={generateScore}>
              <Sparkles className="h-3.5 w-3.5" />
              Generuj Analizę
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
