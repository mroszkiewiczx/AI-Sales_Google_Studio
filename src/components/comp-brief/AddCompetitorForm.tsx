// src/components/comp-brief/AddCompetitorForm.tsx
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAddCompetitor } from "@/hooks/useCompBrief";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

export function AddCompetitorForm() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [monitorArticles, setMonitorArticles] = useState(true);
  const [monitorSocial, setMonitorSocial] = useState(true);
  const [monitorPricing, setMonitorPricing] = useState(true);
  const [monitorJobs, setMonitorJobs] = useState(false);

  const { mutate: addCompetitor, isPending } = useAddCompetitor();

  const handleAdd = () => {
    if (!name) {
      toast.error("Podaj nazwę konkurenta");
      return;
    }
    addCompetitor({
      competitor_name: name,
      competitor_url: url,
      industry,
      monitoring_frequency: frequency,
      monitor_articles: monitorArticles,
      monitor_social: monitorSocial,
      monitor_pricing: monitorPricing,
      monitor_jobs: monitorJobs
    }, {
      onSuccess: () => {
        setName("");
        setUrl("");
        setIndustry("");
        toast.success("Konkurent dodany do śledzenia!");
      },
      onError: (err) => {
        toast.error(`Błąd: ${err.message}`);
      }
    });
  };

  return (
    <Card className="h-full border-0 rounded-none border-r border-border bg-muted/30">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Search className="h-4 w-4" />
          {t("comp_brief.add_competitor")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="space-y-2">
          <Label className="text-xs">{t("comp_brief.competitor_name")}</Label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Nazwa lub URL..."
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">URL strony (opcjonalnie)</Label>
          <Input 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            placeholder="https://..."
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{t("comp_brief.industry")}</Label>
          <Input 
            value={industry} 
            onChange={(e) => setIndustry(e.target.value)} 
            placeholder="Np. ERP, CRM, SaaS..."
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{t("comp_brief.monitoring_frequency")}</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t("comp_brief.frequency.daily")}</SelectItem>
              <SelectItem value="weekly">{t("comp_brief.frequency.weekly")}</SelectItem>
              <SelectItem value="monthly">{t("comp_brief.frequency.monthly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="articles" checked={monitorArticles} onCheckedChange={(v) => setMonitorArticles(!!v)} />
            <Label htmlFor="articles" className="text-xs cursor-pointer">{t("comp_brief.monitor_articles")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="social" checked={monitorSocial} onCheckedChange={(v) => setMonitorSocial(!!v)} />
            <Label htmlFor="social" className="text-xs cursor-pointer">{t("comp_brief.monitor_social")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="pricing" checked={monitorPricing} onCheckedChange={(v) => setMonitorPricing(!!v)} />
            <Label htmlFor="pricing" className="text-xs cursor-pointer">{t("comp_brief.monitor_pricing")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="jobs" checked={monitorJobs} onCheckedChange={(v) => setMonitorJobs(!!v)} />
            <Label htmlFor="jobs" className="text-xs cursor-pointer">{t("comp_brief.monitor_jobs")}</Label>
          </div>
        </div>

        <Button 
          className="w-full gap-2 mt-4" 
          onClick={handleAdd}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {t("comp_brief.add_competitor")}
        </Button>
      </CardContent>
    </Card>
  );
}
