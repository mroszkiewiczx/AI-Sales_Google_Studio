import { useDashboardDeals, DealRow } from "@/hooks/useDashboardDeals";
import { useI18n } from "@/contexts/I18nContext";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ArrowUpDown, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const stageColors: Record<string, string> = {
  prospecting: "bg-muted text-muted-foreground",
  qualification: "bg-primary/10 text-primary",
  proposal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  negotiation: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed_won: "bg-green-500 text-white",
  closed_lost: "bg-destructive/10 text-destructive",
};

const riskColor = (score: number) => {
  if (score >= 70) return "text-destructive font-semibold";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400 font-medium";
  return "text-green-600 dark:text-green-400";
};

export function DealsTable() {
  const {
    data, isLoading, error, refetch,
    page, setPage, sortBy, handleSort,
    filters, setFilters, perPage,
  } = useDashboardDeals();
  const { t, formatCurrency, locale } = useI18n();

  const stages = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"];

  const formatRelative = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return t("deals.today");
    if (diff === 1) return t("deals.yesterday");
    if (diff < 7) return `${diff}${t("deals.daysAgo")}`;
    return d.toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US", { month: "short", day: "numeric" });
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => handleSort(column)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("h-3 w-3", sortBy === column ? "opacity-100" : "opacity-30")} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4 opacity-0 animate-fade-in-up"
      style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
      {/* Stage filter */}
      <Select
        value={filters.stages?.[0] || "all"}
        onValueChange={(v) => setFilters(prev => ({ ...prev, stages: v === "all" ? undefined : [v] }))}
      >
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue placeholder={t("deals.allStages")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("deals.allStages")}</SelectItem>
          {stages.map(s => (
            <SelectItem key={s} value={s}>{t(`deals.stages.${s}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHeader column="name">{t("deals.deal")}</SortableHeader>
              <TableHead>{t("deals.account")}</TableHead>
              <TableHead>{t("deals.owner")}</TableHead>
              <SortableHeader column="stage">{t("deals.stage")}</SortableHeader>
              <SortableHeader column="amount">{t("deals.amount")}</SortableHeader>
              <TableHead>{t("deals.nextStep")}</TableHead>
              <SortableHeader column="last_activity_at">{t("deals.lastActivity")}</SortableHeader>
              <SortableHeader column="risk_score">{t("deals.risk")}</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}

            {error && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">{t("deals.error")}</p>
                  <Button variant="ghost" size="sm" onClick={() => refetch()}>{t("common.retry")}</Button>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                  {t("deals.empty")}
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((deal: DealRow) => (
              <TableRow key={deal.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium max-w-[200px] truncate">{deal.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{"—"}</TableCell>
                <TableCell className="text-sm">{deal.ownerId || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn("text-xs", stageColors[deal.stage])}>
                    {t(`deals.stages.${deal.stage}`)}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums font-medium">{formatCurrency(Number(deal.amount))}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                  {"—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatRelative(deal.updatedAt?.toDate?.()?.toISOString() || deal.updatedAt)}</TableCell>
                <TableCell className={cn("tabular-nums text-sm", riskColor(0))}>
                  {"0"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t("deals.showing")} {(page - 1) * perPage + 1}–{Math.min(page * perPage, data.total)} {t("deals.of")} {data.total}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7"
              disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums px-2">{page} / {data.total_pages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
