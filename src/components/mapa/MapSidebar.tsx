// src/components/mapa/MapSidebar.tsx
import { useI18n } from "@/contexts/I18nContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Info, Route, Trash2, Map as MapIcon } from "lucide-react";
import { ClientMarker, LeadMarker } from "@/hooks/useMapa";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MapSidebarProps {
  activeTab: 'all' | 'clients' | 'leads' | 'route';
  setActiveTab: (tab: any) => void;
  position: { lat: number; lng: number } | null;
  geoError: string | null;
  requestGPS: () => void;
  showDistance: boolean;
  setShowDistance: (show: boolean) => void;
  selectedForRoute: Set<string>;
  setSelectedForRoute: (set: Set<string>) => void;
  clients: ClientMarker[];
  leads: LeadMarker[];
}

export function MapSidebar({
  activeTab,
  setActiveTab,
  position,
  geoError,
  requestGPS,
  showDistance,
  setShowDistance,
  selectedForRoute,
  setSelectedForRoute,
  clients,
  leads
}: MapSidebarProps) {
  const { t } = useI18n();

  const selectedItems = [...clients, ...leads].filter(i => selectedForRoute.has(i.id));

  return (
    <aside className="w-80 bg-card border-r flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          {t("mapa.title")}
        </h2>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("mapa.my_location")}
          </Label>
          <div className="flex gap-2">
            <Input 
              placeholder={position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : t("mapa.location_placeholder")} 
              readOnly
              className="text-xs"
            />
            <Button size="icon" variant="outline" onClick={requestGPS} title={t("mapa.use_gps")}>
              <Navigation className={cn("h-4 w-4", position && "text-primary fill-primary/20")} />
            </Button>
          </div>
          {geoError && <p className="text-[10px] text-destructive">{geoError}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show_distance" 
            checked={showDistance}
            onCheckedChange={(v) => setShowDistance(!!v)}
            disabled={!position}
          />
          <Label htmlFor="show_distance" className="text-xs cursor-pointer">
            {t("mapa.show_distance")}
          </Label>
        </div>
      </div>

      <div className="p-2 border-b">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-4 w-full h-8">
            <TabsTrigger value="all" className="text-[10px]">{t("mapa.tab_all")}</TabsTrigger>
            <TabsTrigger value="clients" className="text-[10px]">{t("mapa.tab_clients")}</TabsTrigger>
            <TabsTrigger value="leads" className="text-[10px]">{t("mapa.tab_leads")}</TabsTrigger>
            <TabsTrigger value="route" className="text-[10px]">{t("mapa.tab_route")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {activeTab === 'route' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  {t("mapa.route_points")}
                </h3>
                {selectedForRoute.size > 0 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedForRoute(new Set())}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {selectedItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedItems.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg text-xs">
                      <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.address}</p>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full mt-4" size="sm">
                    {t("mapa.plan_route")}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <Info className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-xs text-muted-foreground">{t("mapa.route_empty")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("mapa.legend")}
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span>{t("mapa.legend_client")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span>{t("mapa.legend_lead")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span>{t("mapa.legend_me")}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("mapa.nearby_locations")}
                </Label>
                <div className="space-y-2">
                  {[...clients, ...leads].slice(0, 5).map(item => (
                    <div key={item.id} className="p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
