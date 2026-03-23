import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, Calendar, Clock, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TaskHistory({ history }: { history: any[] }) {
  const mockTasks = [
    { id: 1, date: "2024-03-25", time: "12:00", title: "Przygotowanie oferty końcowej", status: "pending", priority: "high", owner: "Mateusz R." },
    { id: 2, date: "2024-03-21", time: "15:00", title: "Wysłanie podsumowania demo", status: "completed", priority: "medium", owner: "Mateusz R." }
  ];

  const tasks = history.length > 0 ? history : mockTasks;

  return (
    <div className="space-y-4">
      {tasks.map((task: any) => (
        <Card key={task.id} className="shadow-none border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {task.date}
                    <Clock className="h-3 w-3 ml-1" />
                    {task.time}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] uppercase tracking-wider h-5">
                  {task.priority}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-2">
                  <User className="h-3 w-3" />
                  {task.owner}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
