// src/components/lead-gen/ResultsTable.tsx
import { useI18n } from "@/contexts/I18nContext";
import { LeadResult } from "@/hooks/useLeadGen";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, UserPlus, ExternalLink, Star, MessageSquare, Globe, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultsTableProps {
  results: LeadResult[];
  selectedIndices: Set<number>;
  onToggleSelect: (index: number) => void;
  onSelectAll: (all: boolean) => void;
  onExport: () => void;
  onImport: () => void;
  isExporting: boolean;
  isImporting: boolean;
}

export function ResultsTable({ 
  results, 
  selectedIndices, 
  onToggleSelect, 
  onSelectAll, 
  onExport, 
  onImport,
  isExporting,
  isImporting
}: ResultsTableProps) {
  const { t } = useI18n();
  const allSelected = selectedIndices.size === results.length && results.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">
            {t("lead_gen.results_count", { count: results.length })}
          </p>
          {selectedIndices.size > 0 && (
            <Badge variant="secondary">
              {t("common.selected", { count: selectedIndices.size })}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {t("lead_gen.export_csv")}
          </Button>
          <Button size="sm" onClick={onImport} disabled={isImporting || selectedIndices.size === 0}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("lead_gen.import_crm")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={(v) => onSelectAll(!!v)}
                />
              </TableHead>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.address")}</TableHead>
              <TableHead>{t("lead_gen.rating")}</TableHead>
              <TableHead>{t("lead_gen.reviews")}</TableHead>
              <TableHead>{t("lead_gen.website")}</TableHead>
              <TableHead>{t("lead_gen.phone")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r, i) => (
              <TableRow 
                key={r.place_id}
                className={cn(selectedIndices.has(i) && "bg-muted/50")}
              >
                <TableCell>
                  <Checkbox 
                    checked={selectedIndices.has(i)}
                    onCheckedChange={() => onToggleSelect(i)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {r.address}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{r.rating.toFixed(1)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span className="text-sm">{r.reviews_count}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {r.website ? (
                    <a 
                      href={r.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      <span className="text-sm">Link</span>
                      <ExternalLink className="h-2 w-2" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {r.phone ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {r.phone}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
