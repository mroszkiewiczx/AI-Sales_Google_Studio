import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Calendar, DollarSign, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const STAGES = [
  { id: "discovery", label: "Discovery", progress: 25 },
  { id: "proposal", label: "Proposal", progress: 50 },
  { id: "negotiation", label: "Negotiation", progress: 75 },
  { id: "closed-won", label: "Closed Won", progress: 100 },
  { id: "closed-lost", label: "Closed Lost", progress: 100 }
];

export function DealsList({ deals }: { deals: any[] }) {
  const mockDeals = [
    { id: 1, title: "Wdrożenie CRM - 15 licencji", value: 45000, stage: "negotiation", createdAt: "2024-03-10" },
    { id: 2, title: "Moduł Automatyzacji", value: 12000, stage: "discovery", createdAt: "2024-03-22" }
  ];

  const activeDeals = deals.length > 0 ? deals : mockDeals;

  return (
    <div className="space-y-4">
      {activeDeals.map((deal: any) => {
        const stage = STAGES.find(s => s.id === deal.stage) || STAGES[0];
        return (
          <Card key={deal.id} className="shadow-none border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{deal.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {deal.createdAt}
                      <DollarSign className="h-3 w-3 ml-1" />
                      {deal.value.toLocaleString()} PLN
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5 font-bold border-primary text-primary">
                  {stage.label}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <span>Postęp Etapu</span>
                  <span>{stage.progress}%</span>
                </div>
                <Progress value={stage.progress} className="h-1.5" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  {STAGES.slice(0, 4).map((s, i) => (
                    <div key={s.id} className="flex flex-col items-center gap-1">
                      {stage.progress >= s.progress ? (
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground/30" />
                      )}
                      <span className={`text-[8px] uppercase tracking-tighter ${stage.id === s.id ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5">
                  <TrendingUp className="h-3 w-3" />
                  Szczegóły
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
