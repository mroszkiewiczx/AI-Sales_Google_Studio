// src/components/client360/ScoringPanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClient360Score } from "@/hooks/useClient360";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";

interface ScoringPanelProps {
  accountId: string;
  lastScore?: any;
}

export function ScoringPanel({ accountId, lastScore }: ScoringPanelProps) {
  const { currentWorkspace: workspace } = useWorkspace();
  const { mutate: generateScore, isPending } = useClient360Score(workspace?.id);

  const probability = lastScore?.win_probability || 0;
  
  const getColor = (prob: number) => {
    if (prob >= 70) return "text-emerald-500 stroke-emerald-500";
    if (prob >= 40) return "text-amber-500 stroke-amber-500";
    return "text-rose-500 stroke-rose-500";
  };

  const getBgColor = (prob: number) => {
    if (prob >= 70) return "bg-emerald-500/10";
    if (prob >= 40) return "bg-amber-500/10";
    return "bg-rose-500/10";
  };

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          AI Scoring
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-2 text-xs" 
          onClick={() => generateScore({ accountId })}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Odśwież
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2 py-4">
          <div className="relative h-32 w-32">
            {/* SVG Ring */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="stroke-muted fill-none"
                strokeWidth="8"
                cx="50"
                cy="50"
                r="40"
              />
              <circle
                className={cn("fill-none transition-all duration-1000", getColor(probability))}
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - probability / 100)}
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tracking-tighter">{probability}%</span>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Szans</span>
            </div>
          </div>
          <Badge className={cn("px-4 py-1", getBgColor(probability), getColor(probability).split(' ')[0])}>
            {lastScore?.label || "Brak oceny"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Akcje
            </p>
            <ul className="space-y-1">
              {lastScore?.actions?.map((action: string, i: number) => (
                <li key={i} className="text-[11px] leading-tight text-muted-foreground">• {action}</li>
              )) || <li className="text-[11px] text-muted-foreground italic">Brak rekomendacji</li>}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-rose-500" />
              Ryzyka
            </p>
            <ul className="space-y-1">
              {lastScore?.risks?.map((risk: string, i: number) => (
                <li key={i} className="text-[11px] leading-tight text-muted-foreground">• {risk}</li>
              )) || <li className="text-[11px] text-muted-foreground italic">Brak ryzyk</li>}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </div>
  );
}
