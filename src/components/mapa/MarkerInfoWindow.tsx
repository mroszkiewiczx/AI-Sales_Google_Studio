// src/components/mapa/MarkerInfoWindow.tsx
import { useI18n } from "@/contexts/I18nContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Navigation, History, Route, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface MarkerInfoWindowProps {
  marker: any;
  userPosition: { lat: number; lng: number } | null;
  showDistance: boolean;
  onToggleRoute: () => void;
  isSelected: boolean;
}

export function MarkerInfoWindow({
  marker,
  userPosition,
  showDistance,
  onToggleRoute,
  isSelected
}: MarkerInfoWindowProps) {
  const { t } = useI18n();

  const calculateDistance = () => {
    if (!userPosition || !marker.lat || !marker.lng) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(marker.lat - userPosition.lat);
    const dLon = deg2rad(marker.lng - userPosition.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(userPosition.lat)) * Math.cos(deg2rad(marker.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d.toFixed(1);
  };

  const deg2rad = (deg: number) => deg * (Math.PI/180);

  const distance = calculateDistance();

  return (
    <div className="p-2 min-w-[200px] space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-sm leading-tight">{marker.name}</h3>
          {marker.type === 'client' ? (
            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {t("mapa.legend_client")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              {t("mapa.legend_lead")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{marker.address}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 py-2 border-y border-border/50">
        {marker.type === 'client' ? (
          <>
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase text-muted-foreground">{t("mapa.deal_status")}</p>
              <p className="text-[10px] font-medium">{marker.deal_status || "—"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase text-muted-foreground">{t("mapa.deal_value")}</p>
              <p className="text-[10px] font-medium">{marker.deal_value ? `${marker.deal_value} PLN` : "—"}</p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase text-muted-foreground">{t("lead_gen.rating")}</p>
              <div className="flex items-center gap-1">
                <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                <span className="text-[10px] font-medium">{marker.rating?.toFixed(1) || marker.google_rating?.toFixed(1) || "—"}</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase text-muted-foreground">{t("lead_gen.reviews")}</p>
              <p className="text-[10px] font-medium">{marker.reviews_count || "—"}</p>
            </div>
          </>
        )}
      </div>

      {showDistance && distance && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary">
          <Navigation className="h-3 w-3" />
          {distance} km {t("mapa.from_you")}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {marker.type === 'client' && (
          <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" asChild>
            <Link to={`/client360/${marker.id}`}>
              <History className="h-3 w-3 mr-1" />
              {t("mapa.client_history")}
            </Link>
          </Button>
        )}
        <Button 
          variant={isSelected ? "secondary" : "outline"} 
          size="sm" 
          className="h-7 text-[10px] flex-1"
          onClick={onToggleRoute}
        >
          {isSelected ? <Check className="h-3 w-3 mr-1" /> : <Route className="h-3 w-3 mr-1" />}
          {isSelected ? t("common.selected") : t("mapa.add_to_route")}
        </Button>
      </div>
    </div>
  );
}
