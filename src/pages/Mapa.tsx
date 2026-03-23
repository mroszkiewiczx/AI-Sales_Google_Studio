// src/pages/Mapa.tsx
import { useState, useMemo } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useMapsKey, useMapData, useGeolocation, ClientMarker, LeadMarker } from "@/hooks/useMapa";
import { MapSidebar } from "@/components/mapa/MapSidebar";
import { MapView } from "@/components/mapa/MapView";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MapaPage() {
  const { t } = useI18n();
  const { key, error: keyError } = useMapsKey();
  const { data, isLoading: isDataLoading, refetch } = useMapData();
  const { position, error: geoError, requestGPS } = useGeolocation();

  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'leads' | 'route'>('all');
  const [selectedForRoute, setSelectedForRoute] = useState<Set<string>>(new Set());
  const [showDistance, setShowDistance] = useState(false);

  const filteredClients = useMemo(() => {
    if (activeTab === 'leads') return [];
    return (data?.clients || []).filter(c => c.lat && c.lng);
  }, [data?.clients, activeTab]);

  const filteredLeads = useMemo(() => {
    if (activeTab === 'clients') return [];
    return (data?.leads || []).filter(l => l.lat && l.lng);
  }, [data?.leads, activeTab]);

  if (keyError === 'no_key') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 text-center">
        <div className="bg-yellow-500/10 p-4 rounded-full">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold">{t("mapa.no_key_title")}</h2>
        <p className="text-muted-foreground max-w-md">
          {t("mapa.no_key_desc")}
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/settings'}>
          {t("nav.settings")}
        </Button>
      </div>
    );
  }

  if (!key || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <MapSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        position={position}
        geoError={geoError}
        requestGPS={requestGPS}
        showDistance={showDistance}
        setShowDistance={setShowDistance}
        selectedForRoute={selectedForRoute}
        setSelectedForRoute={setSelectedForRoute}
        clients={filteredClients}
        leads={filteredLeads}
      />
      
      <main className="flex-1 relative">
        <MapView 
          apiKey={key}
          clients={filteredClients}
          leads={filteredLeads}
          userPosition={position}
          showDistance={showDistance}
          selectedForRoute={selectedForRoute}
          onToggleRoute={(id) => {
            const next = new Set(selectedForRoute);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setSelectedForRoute(next);
          }}
          activeTab={activeTab}
        />
      </main>
    </div>
  );
}
