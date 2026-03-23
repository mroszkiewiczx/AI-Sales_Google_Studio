import { useI18n } from "@/contexts/I18nContext";
import { TaskFilters as FiltersType, TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface Props {
  filters: FiltersType;
  onChange: (f: FiltersType) => void;
}

export function TaskFilters({ filters, onChange }: Props) {
  const { t } = useI18n();

  const toggleType = (type: string) => {
    const current = filters.task_type || [];
    const next = current.includes(type as any)
      ? current.filter(t => t !== type)
      : [...current, type as any];
    onChange({ ...filters, task_type: next.length ? next : undefined });
  };

  const toggleStatus = (status: string) => {
    const current = filters.status || [];
    const next = current.includes(status as any)
      ? current.filter(s => s !== status)
      : [...current, status as any];
    onChange({ ...filters, status: next.length ? next : undefined });
  };

  const reset = () => onChange({});

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium mr-2">Typ:</span>
        {TASK_TYPES.map(type => (
          <Badge
            key={type}
            variant={filters.task_type?.includes(type) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleType(type)}
          >
            {t(`tasks.type${type.replace(/_/g, '').toLowerCase()}`)}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium mr-2">Status:</span>
        {TASK_STATUSES.map(status => (
          <Badge
            key={status}
            variant={filters.status?.includes(status) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleStatus(status)}
          >
            {t(`tasks.status${status.replace(/_/g, '').toLowerCase()}`)}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder={t("tasks.searchClient")}
          value={filters.client_search || ""}
          onChange={e => onChange({ ...filters, client_search: e.target.value || undefined })}
          className="w-64"
        />
        <Select
          value={filters.priority?.[0] || "all"}
          onValueChange={v => onChange({ ...filters, priority: v === "all" ? undefined : [v as any] })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priorytet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {TASK_PRIORITIES.map(p => (
              <SelectItem key={p} value={p}>{t(`tasks.prio${p.toLowerCase()}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="mr-2 h-4 w-4" />
          {t("tasks.resetFilters")}
        </Button>
      </div>
    </div>
  );
}
