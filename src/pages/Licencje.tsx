import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useLicenseCalculator } from "@/hooks/useLicenseCalculator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Package, 
  Factory,
  Save,
  History,
  Download,
  FileText,
  Eye,
  EyeOff,
  Settings2,
  Gift,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const LicencjePage = () => {
  const { t } = useI18n();
  const { 
    billingPeriod, 
    setBillingPeriod, 
    multiplier, 
    setMultiplier, 
    items, 
    updateItem, 
    maintenanceOverride, 
    setMaintenanceOverride, 
    results, 
    products, 
    isLoadingProducts, 
    calculate, 
    save, 
    isCalculating, 
    history 
  } = useLicenseCalculator("default-workspace"); // TODO: Get from context

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("licencje.title")}</h1>
          <p className="text-muted-foreground">{t("licencje.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            const { error } = await supabase.functions.invoke("license-products-sync");
            if (error) toast.error("Błąd synchronizacji");
            else toast.success("Produkty zsynchronizowane");
          }}>
            <Download className="mr-2 h-4 w-4" />
            {t("licencje.syncProducts")}
          </Button>
          <Button onClick={calculate} disabled={isCalculating}>
            <Calculator className="mr-2 h-4 w-4" />
            {isCalculating ? t("common.calculating") : t("licencje.calculate")}
          </Button>
        </div>
      </div>

      {billingPeriod === "annual" && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-4 text-green-700"
        >
          <Gift className="h-6 w-6" />
          <div className="flex-1">
            <p className="font-semibold">{t("licencje.annualPromoTitle")}</p>
            <p className="text-sm opacity-90">{t("licencje.annualPromoDesc")}</p>
          </div>
          <Badge variant="outline" className="bg-green-500 text-white border-none">
            -16.6%
          </Badge>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: PRODUCTS TABLE */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <Tabs 
                value={billingPeriod} 
                onValueChange={(v) => setBillingPeriod(v as any)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="monthly">{t("licencje.monthly")}</TabsTrigger>
                  <TabsTrigger value="annual">{t("licencje.annual")}</TabsTrigger>
                  <TabsTrigger value="perpetual">{t("licencje.perpetual")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>{t("licencje.product")}</TableHead>
                    <TableHead className="w-[100px]">{t("licencje.quantity")}</TableHead>
                    <TableHead className="text-right">{t("licencje.basePrice")}</TableHead>
                    <TableHead className="text-right">{t("licencje.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const item = items[p.id] || { quantity: 1, is_hidden: false };
                    return (
                      <TableRow key={p.id} className={item.is_hidden ? "opacity-40" : ""}>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => updateItem(p.id, { is_hidden: !item.is_hidden })}
                          >
                            {item.is_hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.category}</div>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateItem(p.id, { quantity: Number(e.target.value) })}
                            className="h-8"
                            min={1}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(p.base_price)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(p.base_price * item.quantity * multiplier)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {billingPeriod === "perpetual" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("licencje.maintenance")}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>{t("licencje.maintenanceOverride")}</Label>
                  <Input 
                    type="number" 
                    placeholder="Auto (22%)"
                    value={maintenanceOverride || ""}
                    onChange={(e) => setMaintenanceOverride(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t("licencje.maintenanceDesc")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: SUMMARY & SETTINGS */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                {t("licencje.settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>{t("licencje.multiplier")}</Label>
                  <span className="font-mono">{multiplier.toFixed(2)}x</span>
                </div>
                <Slider 
                  value={[multiplier]} 
                  onValueChange={([v]) => setMultiplier(v)}
                  max={3.0}
                  min={1.0}
                  step={0.05}
                />
              </div>
            </CardContent>
          </Card>

          {results ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle>{t("licencje.summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">{t("licencje.totalNet")}</span>
                    <span className="text-2xl font-bold">{formatCurrency(results.total_net)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm opacity-80">
                    <span>{t("licencje.totalGross")}</span>
                    <span>{formatCurrency(results.total_gross)}</span>
                  </div>
                  {results.maintenance_total > 0 && (
                    <div className="flex justify-between items-center text-sm opacity-80 pt-2 border-t border-primary-foreground/20">
                      <span>{t("licencje.maintenance")}</span>
                      <span>{formatCurrency(results.maintenance_total)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button className="flex-1" size="lg" onClick={() => save()}>
                  <Save className="mr-2 h-5 w-5" />
                  {t("licencje.saveToOffer")}
                </Button>
                <Button variant="outline" size="lg">
                  <FileText className="mr-2 h-5 w-5" />
                  {t("licencje.generatePdf")}
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl opacity-50">
              <Calculator className="h-12 w-12 mb-4" />
              <h3 className="font-semibold">{t("licencje.noResults")}</h3>
              <p className="text-sm text-muted-foreground">{t("licencje.noResultsDesc")}</p>
            </div>
          )}

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("licencje.history")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.length > 0 ? history.map((h: any) => (
                  <div key={h.id} className="flex justify-between items-center p-2 border rounded-md text-sm hover:bg-muted/50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium">{formatCurrency(h.total_net)}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {h.billing_period}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-center text-xs text-muted-foreground py-2">{t("licencje.noHistory")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LicencjePage;
