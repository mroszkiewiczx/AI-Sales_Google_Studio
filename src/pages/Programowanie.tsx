import { useI18n } from "@/contexts/I18nContext";
import { useDevCalculator } from "@/hooks/useDevCalculator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Code2, 
  Plus, 
  Trash2, 
  Calculator, 
  Save, 
  Info,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function ProgramowaniePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { 
    rows, 
    total, 
    addRow, 
    removeRow, 
    updateRow, 
    calculateMutation,
    isCalculating 
  } = useDevCalculator();

  const isAdmin = user?.email === "mateusz.roszkiewicz@optimakers.pl";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("programowanie.title")}</h1>
          <p className="text-muted-foreground">Wycena prac programistycznych, customizacji i integracji.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={addRow} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("programowanie.addRow")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground w-12">Lp.</th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Nazwa pracy</th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground w-[150px]">Kwota (PLN netto)</th>
                      <th className="h-10 px-4 text-center font-medium text-muted-foreground w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {rows.map((row, index) => (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="border-b transition-colors hover:bg-muted/30"
                        >
                          <td className="p-4 font-mono text-xs text-muted-foreground">{index + 1}</td>
                          <td className="p-4">
                            <Input 
                              value={row.nazwa} 
                              onChange={(e) => updateRow(row.id, "nazwa", e.target.value)}
                              className="h-9 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none"
                              placeholder="Opisz zakres prac..."
                            />
                          </td>
                          <td className="p-4">
                            <Input 
                              type="number"
                              value={row.kwota} 
                              onChange={(e) => updateRow(row.id, "kwota", parseFloat(e.target.value) || 0)}
                              className="h-9 text-right font-medium"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeRow(row.id)}
                              disabled={rows.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="bg-blue-500/5 border-blue-500/10">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-500">Informacje systemowe (Widoczne dla Admina)</p>
                  <p className="text-xs text-muted-foreground">
                    HubSpot Product ID: <code className="bg-blue-500/10 px-1 rounded">261061910719</code> (Usługi konsultingowe/h). 
                    Wszystkie pozycje zostaną zmapowane do tego produktu podczas synchronizacji z CRM.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-emerald-600 uppercase tracking-wider">
                {t("programowanie.total")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-emerald-600">
                {total.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-600/80">
                <CheckCircle2 className="h-4 w-4" />
                Wartość netto bez VAT
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button 
              size="lg" 
              className="w-full gap-2 h-12 text-lg shadow-lg shadow-primary/20" 
              onClick={() => calculateMutation.mutate({ save: false })}
              disabled={isCalculating || rows.length === 0}
            >
              <Calculator className={cn("h-5 w-5", isCalculating && "animate-spin")} />
              {t("programowanie.calculate")}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full gap-2 h-12" 
              onClick={() => calculateMutation.mutate({ save: true })}
              disabled={isCalculating || rows.length === 0}
            >
              <Save className="h-5 w-5" />
              {t("programowanie.saveToOffer")}
            </Button>
          </div>

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
              <p>• Prace programistyczne są wyceniane indywidualnie.</p>
              <p>• Kwoty zostaną automatycznie uwzględnione w podsumowaniu oferty.</p>
              <p>• Możesz dodać dowolną liczbę pozycji opisujących zakres prac.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
