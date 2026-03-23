import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useRoiCalculator } from "@/hooks/useRoiCalculator";
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
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

const RoiPage = () => {
  const { t } = useI18n();
  const { 
    inputs, 
    setInputs, 
    results, 
    calculate, 
    save, 
    isCalculating, 
    history 
  } = useRoiCalculator("default-workspace"); // TODO: Get from context

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("roi.title")}</h1>
          <p className="text-muted-foreground">{t("roi.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("Importing from Org Analysis...")}>
            <Download className="mr-2 h-4 w-4" />
            {t("roi.importOrg")}
          </Button>
          <Button onClick={calculate} disabled={isCalculating}>
            <Calculator className="mr-2 h-4 w-4" />
            {isCalculating ? t("common.calculating") : t("roi.calculate")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: INPUTS */}
        <div className="space-y-6">
          {/* Section 1: Labor & Efficiency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                {t("roi.laborSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>{t("roi.employees")}</Label>
                  <span className="font-mono">{inputs.employees}</span>
                </div>
                <Slider 
                  value={[inputs.employees]} 
                  onValueChange={([v]) => setInputs(prev => ({ ...prev, employees: v }))}
                  max={500}
                  step={1}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>{t("roi.hourlyRate")}</Label>
                  <span className="font-mono">{inputs.hourlyRate} PLN/h</span>
                </div>
                <Slider 
                  value={[inputs.hourlyRate]} 
                  onValueChange={([v]) => setInputs(prev => ({ ...prev, hourlyRate: v }))}
                  max={200}
                  step={5}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>{t("roi.wasteMinutes")}</Label>
                  <span className="font-mono">{inputs.wasteMinutes} min/dzień</span>
                </div>
                <Slider 
                  value={[inputs.wasteMinutes]} 
                  onValueChange={([v]) => setInputs(prev => ({ ...prev, wasteMinutes: v }))}
                  max={120}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Inventory & Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                {t("roi.inventorySection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("roi.inventoryValue")}</Label>
                  <Input 
                    type="number" 
                    value={inputs.inventoryValue}
                    onChange={(e) => setInputs(prev => ({ ...prev, inventoryValue: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("roi.annualTurnover")}</Label>
                  <Input 
                    type="number" 
                    value={inputs.annualTurnover}
                    onChange={(e) => setInputs(prev => ({ ...prev, annualTurnover: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>{t("roi.inventoryOptPct")}</Label>
                  <span className="font-mono">{inputs.inventoryOptPct}%</span>
                </div>
                <Slider 
                  value={[inputs.inventoryOptPct]} 
                  onValueChange={([v]) => setInputs(prev => ({ ...prev, inventoryOptPct: v }))}
                  max={50}
                  step={1}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>{t("roi.productionGrowthPct")}</Label>
                  <span className="font-mono">{inputs.productionGrowthPct}%</span>
                </div>
                <Slider 
                  value={[inputs.productionGrowthPct]} 
                  onValueChange={([v]) => setInputs(prev => ({ ...prev, productionGrowthPct: v }))}
                  max={30}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Investment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                {t("roi.investmentSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("roi.licenseCost")}</Label>
                  <Input 
                    type="number" 
                    value={inputs.licenseCost}
                    onChange={(e) => setInputs(prev => ({ ...prev, licenseCost: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("roi.implementationCost")}</Label>
                  <Input 
                    type="number" 
                    value={inputs.implementationCost}
                    onChange={(e) => setInputs(prev => ({ ...prev, implementationCost: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>{t("roi.licenseType")}</Label>
                <Tabs 
                  value={inputs.licenseType} 
                  onValueChange={(v) => setInputs(prev => ({ ...prev, licenseType: v as any }))}
                >
                  <TabsList>
                    <TabsTrigger value="subscription">{t("roi.subscription")}</TabsTrigger>
                    <TabsTrigger value="license">{t("roi.license")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {inputs.licenseType === "subscription" && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>{t("roi.licenseYears")}</Label>
                    <span className="font-mono">{inputs.licenseYears} lat</span>
                  </div>
                  <Slider 
                    value={[inputs.licenseYears]} 
                    onValueChange={([v]) => setInputs(prev => ({ ...prev, licenseYears: v }))}
                    max={10}
                    min={1}
                    step={1}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="space-y-6">
          {results ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl">{t("roi.resultsTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("roi.totalGain")}</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(results.totalGain)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("roi.paybackMonths")}</p>
                    <p className="text-3xl font-bold text-blue-600">{results.paybackMonths} {t("common.months")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("roi.annualLaborLoss")}</p>
                    <p className="text-xl font-semibold">{formatCurrency(results.annualLaborLoss)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("roi.freedCapital")}</p>
                    <p className="text-xl font-semibold">{formatCurrency(results.freedCapital)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Financing Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("roi.financing")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("roi.leaseMonths")}</Label>
                      <Slider 
                        value={[inputs.leaseMonths]} 
                        onValueChange={([v]) => setInputs(prev => ({ ...prev, leaseMonths: v }))}
                        max={60}
                        min={0}
                        step={12}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("roi.initialPaymentPct")}</Label>
                      <Slider 
                        value={[inputs.initialPaymentPct]} 
                        onValueChange={([v]) => setInputs(prev => ({ ...prev, initialPaymentPct: v }))}
                        max={50}
                        step={5}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("roi.leaseMonthly")}</p>
                      <p className="text-xl font-bold">{formatCurrency(results.leaseMonthly)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("roi.leaseInitPayment")}</p>
                      <p className="text-xl font-bold">{formatCurrency(results.leaseInitPayment)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button className="flex-1" size="lg" onClick={() => save()}>
                  <Save className="mr-2 h-5 w-5" />
                  {t("roi.saveToOffer")}
                </Button>
                <Button variant="outline" size="lg">
                  <FileText className="mr-2 h-5 w-5" />
                  {t("roi.generatePdf")}
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-xl opacity-50">
              <Calculator className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold">{t("roi.noResults")}</h3>
              <p className="text-muted-foreground">{t("roi.noResultsDesc")}</p>
            </div>
          )}

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t("roi.history")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.length > 0 ? history.map((h: any) => (
                  <div key={h.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium">{formatCurrency(h.total_gain)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{h.payback_months} {t("common.months")}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-4">{t("roi.noHistory")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoiPage;
