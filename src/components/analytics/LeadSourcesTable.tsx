import { useI18n } from "@/contexts/I18nContext";
import { LeadSource } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  data: LeadSource[];
  isLoading: boolean;
}

export function LeadSourcesTable({ data, isLoading }: Props) {
  const { t } = useI18n();

  if (isLoading) {
    return <Card className="h-[400px] animate-pulse bg-muted/20" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analytics.leadSources")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("analytics.source")}</TableHead>
              <TableHead className="text-right">{t("analytics.leads")}</TableHead>
              <TableHead className="text-right">{t("analytics.conversion")}</TableHead>
              <TableHead className="text-right">{t("analytics.revenue")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.source}>
                <TableCell className="font-medium">{row.source}</TableCell>
                <TableCell className="text-right">{row.leads}</TableCell>
                <TableCell className="text-right">{row.conversion.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{row.revenue.toLocaleString()} PLN</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
