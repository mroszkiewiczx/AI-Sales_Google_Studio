import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { useI18n } from "@/contexts/I18nContext";
import { KpiCard } from "./KpiCard";
import {
  DollarSign, TrendingUp, Calendar, Bell,
  CheckSquare, AlertTriangle, Users, BarChart3, Target
} from "lucide-react";

export function KpiGrid() {
  const { data, isLoading, error, refetch } = useDashboardSummary();
  const { t, formatCurrency } = useI18n();

  const fc = (val: number) => formatCurrency(val);

  const kpis = [
    {
      label: t("kpi.pipelineValue.label"),
      value: data ? fc(data.pipeline_value) : fc(0),
      icon: <DollarSign className="h-4 w-4" />,
      definition: t("kpi.pipelineValue.definition"),
    },
    {
      label: t("kpi.weightedPipeline.label"),
      value: data ? fc(data.weighted_pipeline) : fc(0),
      icon: <TrendingUp className="h-4 w-4" />,
      definition: t("kpi.weightedPipeline.definition"),
    },
    {
      label: t("kpi.closingThisMonth.label"),
      value: data?.deals_closing_this_month ?? 0,
      icon: <Calendar className="h-4 w-4" />,
      definition: t("kpi.closingThisMonth.definition"),
    },
    {
      label: t("kpi.unreadMessages.label"),
      value: data?.unread_emails ?? 0,
      icon: <Bell className="h-4 w-4" />,
      definition: t("kpi.unreadMessages.definition"),
    },
    {
      label: t("kpi.tasksDueToday.label"),
      value: data?.tasks_due_today ?? 0,
      icon: <CheckSquare className="h-4 w-4" />,
      definition: t("kpi.tasksDueToday.definition"),
    },
    {
      label: t("kpi.staleDeals.label"),
      value: data?.stale_deals ?? 0,
      icon: <AlertTriangle className="h-4 w-4" />,
      definition: t("kpi.staleDeals.definition"),
    },
    {
      label: t("kpi.noBriefing.label"),
      value: data?.meetings_without_briefing ?? 0,
      icon: <Users className="h-4 w-4" />,
      definition: t("kpi.noBriefing.definition"),
    },
    {
      label: t("kpi.leadSources.label"),
      value: data ? Object.keys(data.lead_inflow_by_source).length : 0,
      icon: <BarChart3 className="h-4 w-4" />,
      definition: t("kpi.leadSources.definition"),
    },
    {
      label: t("kpi.forecastVsTarget.label"),
      value: data
        ? `${Math.round((data.forecast_value / Math.max(data.forecast_target, 1)) * 100)}%`
        : "0%",
      icon: <Target className="h-4 w-4" />,
      definition: t("kpi.forecastVsTarget.definition"),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, i) => (
        <KpiCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          icon={kpi.icon}
          metricDefinition={kpi.definition}
          loading={isLoading}
          error={error ? t("common.error") : undefined}
          onRetry={refetch}
          delay={i * 80}
        />
      ))}
    </div>
  );
}
