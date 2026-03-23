import { useState } from "react";
import { useParams } from "react-router-dom";
import { useClient360 } from "@/hooks/useClient360";
import { AccountSearch } from "@/components/client360/AccountSearch";
import { AccountCard } from "@/components/client360/AccountCard";
import { ScoringPanel } from "@/components/client360/ScoringPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CallHistory } from "@/components/client360/CallHistory";
import { EmailHistory } from "@/components/client360/EmailHistory";
import { TaskHistory } from "@/components/client360/TaskHistory";
import { AiAnalyses } from "@/components/client360/AiAnalyses";
import { DealsList } from "@/components/client360/DealsList";
import { Skeleton } from "@/components/ui/skeleton";

export default function Client360Page() {
  const { accountId } = useParams();
  const { data, loading } = useClient360(accountId);
  const [activeTab, setActiveTab] = useState("calls");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Column: 400px */}
      <div className="w-[400px] border-r border-border bg-muted/30 flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <AccountSearch />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {accountId ? (
            loading ? (
              <div className="space-y-6">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <>
                <AccountCard account={data?.account} contacts={data?.contacts} />
                <ScoringPanel score={data?.score} accountId={accountId} />
              </>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <AccountSearch className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Wybierz klienta</p>
                <p className="text-xs text-muted-foreground">Wyszukaj firmę, aby zobaczyć pełną historię i analizę 360°</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: flex-1 */}
      <div className="flex-1 flex flex-col h-full bg-background">
        {accountId && data ? (
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-border">
              <h1 className="text-2xl font-bold tracking-tight">{data.account.name}</h1>
              <p className="text-sm text-muted-foreground">{data.account.industry} • {data.account.size}</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-6 border-b border-border">
                <TabsList className="h-12 bg-transparent p-0 gap-6">
                  <TabsTrigger value="calls" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0">Historia Rozmów</TabsTrigger>
                  <TabsTrigger value="emails" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0">E-maile</TabsTrigger>
                  <TabsTrigger value="tasks" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0">Zadania</TabsTrigger>
                  <TabsTrigger value="ai" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0">Analizy AI</TabsTrigger>
                  <TabsTrigger value="deals" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0">Szanse (Deals)</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="calls" className="m-0"><CallHistory history={data.history.calls} /></TabsContent>
                <TabsContent value="emails" className="m-0"><EmailHistory history={data.history.emails} /></TabsContent>
                <TabsContent value="tasks" className="m-0"><TaskHistory history={data.history.tasks} /></TabsContent>
                <TabsContent value="ai" className="m-0"><AiAnalyses score={data.score} /></TabsContent>
                <TabsContent value="deals" className="m-0"><DealsList deals={data.deals} /></TabsContent>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Wybierz klienta z listy po lewej stronie
          </div>
        )}
      </div>
    </div>
  );
}
