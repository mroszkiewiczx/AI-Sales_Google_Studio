import { useI18n } from "@/contexts/I18nContext";
import { AnalyticsKpi } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Percent, Clock, Briefcase, Target, Mic, CheckSquare, UserPlus, Trophy } from "lucide-react";

interface Props {
  kpi?: AnalyticsKpi;
  isLoading: boolean;
}

function KpiCard({ label, value, change, suffix = "", icon: Icon }: { label: string; value: string | number; change?: number | null; suffix?: string; icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}{suffix}</div>
        {change !== undefined && change !== null && (
          <p className={`text-xs flex items-center mt-1 ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(change).toFixed(1)}% vs poprzedni okres
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatCards({ kpi, isLoading }: Props) {
  const { t } = useI18n();

  if (isLoading || !kpi) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <KpiCard label={t("analytics.revenue")} value={kpi.revenue.toLocaleString()} suffix=" PLN" change={kpi.revenue_change} icon={DollarSign} />
      <KpiCard label={t("analytics.conversionRate")} value={kpi.conversion_rate.toFixed(1)} suffix="%" change={kpi.conversion_change} icon={Percent} />
      <KpiCard label={t("analytics.avgCloseDays")} value={kpi.avg_close_days.toFixed(1)} suffix=" dni" change={kpi.close_days_change} icon={Clock} />
      <KpiCard label={t("analytics.openDeals")} value={kpi.open_deals_count} icon={Briefcase} />
      
      <KpiCard label={t("analytics.avgBant")} value={kpi.avg_bant_score?.toFixed(0) ?? "—"} suffix="/100" icon={Target} />
      <KpiCard label={t("analytics.transcripts")} value={kpi.transcripts_count} icon={Mic} />
      <KpiCard label={t("analytics.tasksCompleted")} value={kpi.tasks_completed_count} icon={CheckSquare} />
      <KpiCard label={t("analytics.newLeads")} value={kpi.new_leads_count} icon={UserPlus} />
      <KpiCard label={t("analytics.winRate")} value={kpi.win_rate != null ? `${(kpi.win_rate*100).toFixed(0)}%` : "—"} icon={Trophy} />
    </div>
  );
}
