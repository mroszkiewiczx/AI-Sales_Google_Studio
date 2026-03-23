import { Card, CardContent } from "@/components/ui/card";
import { Phone, Calendar, Clock, Play, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CallHistory({ history }: { history: any[] }) {
  const mockCalls = [
    { id: 1, date: "2024-03-20", time: "14:30", duration: "15:20", type: "Discovery", summary: "Omówienie potrzeb CRM, 15 handlowców, budżet w trakcie ustalania." },
    { id: 2, date: "2024-03-15", time: "10:00", duration: "05:45", type: "Follow-up", summary: "Potwierdzenie terminu prezentacji demo." }
  ];

  const calls = history.length > 0 ? history : mockCalls;

  return (
    <div className="space-y-4">
      {calls.map((call: any) => (
        <Card key={call.id} className="shadow-none border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{call.type}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {call.date}
                    <Clock className="h-3 w-3 ml-1" />
                    {call.time} ({call.duration})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Play className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><FileText className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{call.summary}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
