// src/components/client360/PipelineMini.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, TrendingUp, CheckCircle2, Clock, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineMiniProps {
  stats?: {
    lead: number;
    meeting: number;
    proposal: number;
    closing: number;
  };
}

export function PipelineMini({ stats }: PipelineMiniProps) {
  const stages = [
    { id: "lead", label: "Lead", icon: Clock, count: stats?.lead || 0, color: "bg-blue-500/10 text-blue-500" },
    { id: "meeting", label: "Spotkanie", icon: FileText, count: stats?.meeting || 0, color: "bg-purple-500/10 text-purple-500" },
    { id: "proposal", label: "Oferta", icon: Send, count: stats?.proposal || 0, color: "bg-amber-500/10 text-amber-500" },
    { id: "closing", label: "Zamykanie", icon: CheckCircle2, count: stats?.closing || 0, color: "bg-emerald-500/10 text-emerald-500" },
  ];

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Pipeline Mini
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {stages.map((stage) => (
            <div key={stage.id} className={cn("p-3 rounded-xl border border-border/50 flex flex-col gap-2", stage.color)}>
              <div className="flex items-center justify-between">
                <stage.icon className="h-3.5 w-3.5" />
                <span className="text-lg font-bold tracking-tighter">{stage.count}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{stage.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
