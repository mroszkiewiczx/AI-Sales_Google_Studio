import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { DealsTable } from "@/components/dashboard/DealsTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useI18n } from "@/contexts/I18nContext";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Building2 } from "lucide-react";

export default function DashboardPage() {
  const { currentWorkspace, loading } = useWorkspace();
  const { t, formatDate } = useI18n();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-3">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-semibold">{t("dashboard.noWorkspace")}</h2>
          <p className="text-sm text-muted-foreground">{t("dashboard.noWorkspaceDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">{t("dashboard.title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentWorkspace.name} — {formatDate(new Date(), { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <KpiGrid />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.activeDeals")}</h3>
          <QuickActions />
        </div>
        <DealsTable />
      </div>
    </div>
  );
}
