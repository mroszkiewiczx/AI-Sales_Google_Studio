// src/components/lead-gen/SearchForm.tsx
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { SearchConfig, useLeadSearchConfigs } from "@/hooks/useLeadGen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Save, Loader2, History } from "lucide-react";
import { toast } from "sonner";

interface SearchFormProps {
  onSearch: (config: SearchConfig) => void;
  isSearching: boolean;
}

export function SearchForm({ onSearch, isSearching }: SearchFormProps) {
  const { t } = useI18n();
  const { configs, saveConfig } = useLeadSearchConfigs();
  
  const [config, setConfig] = useState<SearchConfig>({
    region: "",
    industry: "",
    min_rating: 3.5,
    min_reviews: 10,
    has_website: true,
    max_results: 25,
    keyword: ""
  });

  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);

  const handleSave = () => {
    if (!saveName) return;
    saveConfig.mutate({ name: saveName, config }, {
      onSuccess: () => {
        toast.success(t("common.saved"));
        setShowSave(false);
        setSaveName("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t("lead_gen.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("lead_gen.region")}</Label>
            <Input 
              placeholder="np. Poznań, Wielkopolska" 
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("lead_gen.industry")}</Label>
            <Select 
              value={config.industry} 
              onValueChange={(v) => setConfig({ ...config, industry: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Restauracje">Restauracje</SelectItem>
                <SelectItem value="Hotele">Hotele</SelectItem>
                <SelectItem value="Usługi budowlane">Usługi budowlane</SelectItem>
                <SelectItem value="Salony urody">Salony urody</SelectItem>
                <SelectItem value="Siłownie">Siłownie</SelectItem>
                <SelectItem value="Sklepy">Sklepy</SelectItem>
                <SelectItem value="Usługi IT">Usługi IT</SelectItem>
                <SelectItem value="Usługi prawne">Usługi prawne</SelectItem>
                <SelectItem value="Stomatologia">Stomatologia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("lead_gen.keyword")}</Label>
            <Input 
              placeholder="np. sklep meblowy" 
              value={config.keyword}
              onChange={(e) => setConfig({ ...config, keyword: e.target.value })}
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between">
              <Label>{t("lead_gen.min_rating")}</Label>
              <span className="text-sm font-medium">{config.min_rating} ⭐</span>
            </div>
            <Slider 
              value={[config.min_rating]} 
              min={1} 
              max={5} 
              step={0.5}
              onValueChange={([v]) => setConfig({ ...config, min_rating: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("lead_gen.min_reviews")}</Label>
            <Input 
              type="number" 
              value={config.min_reviews}
              onChange={(e) => setConfig({ ...config, min_reviews: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="has_website" 
              checked={config.has_website}
              onCheckedChange={(v) => setConfig({ ...config, has_website: !!v })}
            />
            <Label htmlFor="has_website" className="cursor-pointer">
              {t("lead_gen.has_website")}
            </Label>
          </div>

          <div className="space-y-2">
            <Label>{t("lead_gen.max_results")}</Label>
            <Select 
              value={config.max_results.toString()} 
              onValueChange={(v) => setConfig({ ...config, max_results: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 space-y-2">
            <Button 
              className="w-full" 
              disabled={isSearching || !config.region || !config.industry}
              onClick={() => onSearch(config)}
            >
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {t("lead_gen.generate")}
            </Button>
            
            {!showSave ? (
              <Button variant="outline" className="w-full" onClick={() => setShowSave(true)}>
                <Save className="mr-2 h-4 w-4" />
                {t("lead_gen.save_config")}
              </Button>
            ) : (
              <div className="space-y-2 pt-2 border-t">
                <Input 
                  placeholder={t("common.name")} 
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowSave(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button className="flex-1" onClick={handleSave} disabled={!saveName}>
                    {t("common.save")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              {t("lead_gen.saved_configs")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {configs.map((c: any) => (
                <button
                  key={c.id}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm"
                  onClick={() => setConfig(c.config)}
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.config.region} • {c.config.industry}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
