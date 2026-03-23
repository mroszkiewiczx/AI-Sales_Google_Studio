import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { StatCards } from "@/components/analytics/StatCards";
import { PipelineChart } from "@/components/analytics/PipelineChart";
import { LeadSourcesTable } from "@/components/analytics/LeadSourcesTable";
import { SalespeopleRanking } from "@/components/analytics/SalespeopleRanking";

export default function AnalyticsPage() {
  const { t } = useI18n();
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const defaultPeriod = `${now.getFullYear()}-Q${currentQuarter}`;
  
  const [period, setPeriod] = useState(defaultPeriod);
  const { data, isLoading, error } = useAnalytics(period);

  const periodOptions = [
    { value: `${now.getFullYear()}-Q1`, label: `Q1 ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-Q2`, label: `Q2 ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-Q3`, label: `Q3 ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-Q4`, label: `Q4 ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-01`, label: `Styczeń ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-02`, label: `Luty ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-03`, label: `Marzec ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-04`, label: `Kwiecień ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-05`, label: `Maj ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-06`, label: `Czerwiec ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-07`, label: `Lipiec ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-08`, label: `Sierpień ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-09`, label: `Wrzesień ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-10`, label: `Październik ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-11`, label: `Listopad ${now.getFullYear()}` },
    { value: `${now.getFullYear()}-12`, label: `Grudzień ${now.getFullYear()}` },
  ];

  const handleExport = () => {
    window.print(); // Simple PDF export via browser print
  };

  if (error) {
    return <div className="p-8 text-destructive">{t("common.error")}: {(error as Error).message}</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.analytics")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("analytics.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Wybierz okres" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t("analytics.exportPdf")}
          </Button>
        </div>
      </div>

      <StatCards kpi={data?.kpi} isLoading={isLoading} />

      <div className="grid gap-4 md:grid-cols-3">
        <PipelineChart data={data?.pipeline || []} isLoading={isLoading} />
        <LeadSourcesTable data={data?.leadSources || []} isLoading={isLoading} />
      </div>

      <SalespeopleRanking data={data?.ranking || []} isLoading={isLoading} />
    </div>
  );
}
