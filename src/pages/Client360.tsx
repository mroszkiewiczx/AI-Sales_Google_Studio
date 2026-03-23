// src/pages/Client360.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useClient360, useAccountSearch } from "@/hooks/useClient360";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users2, Mail, Phone, Calendar, FileText, TrendingUp, Building2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoringPanel } from "@/components/client360/ScoringPanel";
import { AccountCard } from "@/components/client360/AccountCard";
import { PipelineMini } from "@/components/client360/PipelineMini";
import { HistoryTabs } from "@/components/client360/HistoryTabs";

export default function Client360() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace: workspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: searchResults, isLoading: isSearching } = useAccountSearch(searchTerm, workspace?.id);
  const { data: clientData, isLoading: isDataLoading } = useClient360(accountId, workspace?.id);

  const handleAccountSelect = (id: string) => {
    setSearchTerm("");
    navigate(`/client360/${id}`);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Lewa kolumna: Wyszukiwanie i Podsumowanie */}
      <div className="w-[380px] border-r border-border flex flex-col bg-muted/10">
        <div className="p-4 border-b border-border space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj klienta..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm.length >= 2 && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
                <CardContent className="p-2">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : searchResults?.length === 0 ? (
                    <p className="text-xs text-center p-4 text-muted-foreground">Nie znaleziono klientów</p>
                  ) : (
                    <div className="space-y-1">
                      {searchResults?.map((acc) => (
                        <Button
                          key={acc.id}
                          variant="ghost"
                          className="w-full justify-start text-left text-sm h-auto py-2"
                          onClick={() => handleAccountSelect(acc.id)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{acc.name}</span>
                            <span className="text-[10px] text-muted-foreground">{acc.city || "Brak miasta"}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!accountId ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <Users2 className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Wybierz klienta</p>
                <p className="text-xs text-muted-foreground">Wyszukaj firmę, aby zobaczyć widok 360°</p>
              </div>
            </div>
          ) : isDataLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <AccountCard account={clientData?.account} contact={clientData?.contacts?.find((c: any) => c.is_primary)} />
              <ScoringPanel accountId={accountId} lastScore={clientData?.lastScore} />
              <PipelineMini stats={clientData?.pipeline} />
            </>
          )}
        </div>
      </div>

      {/* Prawa kolumna: Historia i Detale */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {accountId && !isDataLoading ? (
          <HistoryTabs data={clientData} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/5">
            <div className="text-center space-y-2">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
              <p className="text-sm text-muted-foreground">Widok historii i analiz pojawi się po wybraniu klienta</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
