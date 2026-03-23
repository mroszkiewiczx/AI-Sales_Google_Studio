import React, { useState } from "react";
import { useLeadIntel } from "@/hooks/useLeadIntel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Building, Globe, Newspaper, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function IntelPanel() {
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, error } = useLeadIntel(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 2) {
      setSearchQuery(query.trim());
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] border rounded-lg bg-card">
      <div className="p-4 border-b bg-muted/10">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Wpisz nazwę firmy lub NIP..."
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || query.length < 3}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Szukaj
          </Button>
        </form>
      </div>

      <ScrollArea className="flex-1 p-6">
        {!searchQuery ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-12">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">Wyszukiwarka Lead Intel</h3>
            <p className="max-w-md mt-2">
              Wpisz nazwę firmy, aby zebrać informacje z CRM, sieci (SerpApi) oraz rejestrów (KRS/NIP).
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Zbieranie danych wywiadowczych...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            Wystąpił błąd: {(error as Error).message}
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building className="h-6 w-6 text-primary" />
                {data.company_info.name}
              </h2>
              <Badge variant="outline" className="text-xs">
                {data.crm_data?.accounts?.length ? "Znaleziono w CRM" : "Nowy lead"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Podsumowanie z sieci
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {data.web_summary}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Dane firmy
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">NIP</span>
                    <span className="font-medium">{data.company_info.nip || "Brak danych"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">KRS</span>
                    <span className="font-medium">{data.company_info.krs || "Brak danych"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Pracownicy</span>
                    <span className="font-medium">{data.company_info.employees || "Brak danych"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Przychód</span>
                    <span className="font-medium">{data.company_info.revenue_estimate || "Brak danych"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {data.key_facts?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    Kluczowe fakty i nowości
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {data.key_facts.map((fact, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span dangerouslySetInnerHTML={{ __html: fact }} />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {data.risks?.length > 0 && (
              <Card className="border-rose-200 bg-rose-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                    Potencjalne ryzyka
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-rose-800">
                    {data.risks.map((risk, i) => (
                      <li key={i}>• {risk}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {data.sources?.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <LinkIcon className="h-4 w-4" />
                  Źródła
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.sources.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[200px]">
                      {src}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </ScrollArea>
    </div>
  );
}
