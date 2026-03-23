import { useI18n } from "@/contexts/I18nContext";
import { PipelineStage } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: PipelineStage[];
  isLoading: boolean;
}

export function PipelineChart({ data, isLoading }: Props) {
  const { t } = useI18n();

  if (isLoading) {
    return <Card className="h-[400px] animate-pulse bg-muted/20" />;
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{t("analytics.pipelineValue")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" tickFormatter={(v) => `${v / 1000}k`} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString()} PLN`, 'Wartość']} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
