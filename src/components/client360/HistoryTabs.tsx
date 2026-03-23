// src/components/client360/HistoryTabs.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Calendar, FileText, TrendingUp, ExternalLink, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface HistoryTabsProps {
  data: any;
}

export function HistoryTabs({ data }: HistoryTabsProps) {
  if (!data) return null;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: pl });
  };

  return (
    <Tabs defaultValue="calls" className="flex-1 flex flex-col h-full">
      <div className="px-6 pt-4 border-b border-border bg-muted/5">
        <TabsList className="bg-transparent h-12 w-full justify-start gap-6 border-none p-0">
          <TabsTrigger value="calls" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2 text-xs">
            <Phone className="h-3.5 w-3.5" />
            AI Rozmowy
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{data.calls?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2 text-xs">
            <Mail className="h-3.5 w-3.5" />
            E-maile
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{data.emails?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Zadania
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{data.tasks?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="analyses" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            Analizy AI
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{data.analyses?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deals" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Szanse
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{data.deals?.length || 0}</Badge>
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4">
            <TabsContent value="calls" className="m-0 space-y-4">
              {data.calls?.map((call: any) => (
                <Card key={call.id} className="shadow-none border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{call.title || "Rozmowa telefoniczna"}</p>
                        <span className="text-[10px] text-muted-foreground">{formatDate(call.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{call.summary || "Brak podsumowania rozmowy"}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                          <Clock className="h-2.5 w-2.5" />
                          {call.duration || "0:00"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                          <User className="h-2.5 w-2.5" />
                          {call.contact_name || "Nieznany"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!data.calls || data.calls.length === 0) && <EmptyState icon={Phone} label="Brak rozmów" />}
            </TabsContent>

            <TabsContent value="emails" className="m-0 space-y-4">
              {data.emails?.map((email: any) => (
                <Card key={email.id} className="shadow-none border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{email.subject || "Brak tematu"}</p>
                        <span className="text-[10px] text-muted-foreground">{formatDate(email.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{email.snippet || "Brak treści"}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                          {email.direction === "inbound" ? "Otrzymany" : "Wysłany"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!data.emails || data.emails.length === 0) && <EmptyState icon={Mail} label="Brak e-maili" />}
            </TabsContent>

            <TabsContent value="tasks" className="m-0 space-y-4">
              {data.tasks?.map((task: any) => (
                <Card key={task.id} className="shadow-none border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", task.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                      {task.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{task.title}</p>
                        <span className="text-[10px] text-muted-foreground">{formatDate(task.due_date || task.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description || "Brak opisu zadania"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!data.tasks || data.tasks.length === 0) && <EmptyState icon={Calendar} label="Brak zadań" />}
            </TabsContent>

            <TabsContent value="analyses" className="m-0 space-y-4">
              {data.analyses?.map((analysis: any) => (
                <Card key={analysis.id} className="shadow-none border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{analysis.title || "Analiza AI"}</p>
                        <span className="text-[10px] text-muted-foreground">{formatDate(analysis.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{analysis.content || "Brak treści analizy"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!data.analyses || data.analyses.length === 0) && <EmptyState icon={TrendingUp} label="Brak analiz" />}
            </TabsContent>

            <TabsContent value="deals" className="m-0 space-y-4">
              {data.deals?.map((deal: any) => (
                <Card key={deal.id} className="shadow-none border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{deal.title}</p>
                        <span className="text-[10px] text-muted-foreground">{formatDate(deal.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {deal.amount?.toLocaleString()} PLN
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 uppercase">
                          {deal.stage}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {deal.probability}% szans
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!data.deals || data.deals.length === 0) && <EmptyState icon={FileText} label="Brak szans sprzedaży" />}
            </TabsContent>
          </div>
        </ScrollArea>
      </div>
    </Tabs>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-30">
      <Icon className="h-10 w-10" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
