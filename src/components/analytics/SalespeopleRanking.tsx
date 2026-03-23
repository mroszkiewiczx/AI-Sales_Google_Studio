import { useI18n } from "@/contexts/I18nContext";
import { SalespersonRanking } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

interface Props {
  data: SalespersonRanking[];
  isLoading: boolean;
}

export function SalespeopleRanking({ data, isLoading }: Props) {
  const { t } = useI18n();

  if (isLoading) {
    return <Card className="h-[400px] animate-pulse bg-muted/20" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          {t("analytics.salespeopleRanking")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("analytics.salesperson")}</TableHead>
              <TableHead className="text-right">{t("analytics.closedDeals")}</TableHead>
              <TableHead className="text-right">{t("analytics.revenue")}</TableHead>
              <TableHead className="text-right">{t("analytics.commission")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right">{row.closed_deals}</TableCell>
                <TableCell className="text-right">{row.revenue.toLocaleString()} PLN</TableCell>
                <TableCell className="text-right text-emerald-600 font-medium">{row.commission.toLocaleString()} PLN</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
