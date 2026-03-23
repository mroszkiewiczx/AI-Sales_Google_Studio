import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  metricDefinition?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onClick?: () => void;
  trend?: { value: number; positive: boolean };
  className?: string;
  delay?: number;
}

export function KpiCard({
  label, value, icon, metricDefinition, loading, error,
  onRetry, onClick, trend, className, delay = 0,
}: KpiCardProps) {
  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardContent className="p-5">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("relative overflow-hidden border-destructive/30", className)}>
        <CardContent className="p-5 flex flex-col items-center justify-center min-h-[120px] text-center">
          <AlertCircle className="h-5 w-5 text-destructive mb-2" />
          <p className="text-xs text-muted-foreground mb-2">{error}</p>
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 text-xs">
              <RefreshCw className="mr-1 h-3 w-3" /> Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-[box-shadow] duration-200",
        onClick && "cursor-pointer hover:shadow-md active:scale-[0.98]",
        "opacity-0 animate-fade-in-up",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
            {metricDefinition && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">
                  {metricDefinition}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {icon && <div className="text-muted-foreground/40">{icon}</div>}
        </div>

        <div className="mt-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
        </div>

        {trend && (
          <div className={cn("mt-1.5 text-xs font-medium",
            trend.positive ? "text-green-600 dark:text-green-400" : "text-destructive")}>
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}
