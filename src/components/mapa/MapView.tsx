// src/components/mapa/MapView.tsx
import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { ClientMarker, LeadMarker } from "@/hooks/useMapa";
import { MarkerInfoWindow } from "./MarkerInfoWindow";
import { useI18n } from "@/contexts/I18nContext";

interface MapViewProps {
  apiKey: string;
  clients: ClientMarker[];
  leads: LeadMarker[];
  userPosition: { lat: number; lng: number } | null;
  showDistance: boolean;
  selectedForRoute: Set<string>;
  onToggleRoute: (id: string) => void;
  activeTab: 'all' | 'clients' | 'leads' | 'route';
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 52.2297,
  lng: 21.0122
};

export function MapView({
  apiKey,
  clients,
  leads,
  userPosition,
  showDistance,
  selectedForRoute,
  onToggleRoute,
  activeTab
}: MapViewProps) {
  const { t } = useI18n();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<any>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = (marker: any, type: 'client' | 'lead') => {
    setActiveMarker({ ...marker, type });
  };

  if (!isLoaded) return null;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userPosition || center}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      }}
    >
      {/* Moja lokalizacja */}
      {userPosition && (
        <Marker 
          position={userPosition}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
          }}
          title={t("mapa.legend_me")}
        />
      )}

      {/* Klienci */}
      {clients.map(c => (
        <Marker 
          key={c.id}
          position={{ lat: c.lat, lng: c.lng }}
          onClick={() => handleMarkerClick(c, 'client')}
          icon={{
            url: `https://maps.google.com/mapfiles/ms/icons/green-dot.png`,
            scaledSize: new google.maps.Size(32, 32)
          }}
          opacity={selectedForRoute.has(c.id) ? 1 : 0.8}
        />
      ))}

      {/* Leady */}
      {leads.map(l => (
        <Marker 
          key={l.id}
          position={{ lat: l.lat, lng: l.lng }}
          onClick={() => handleMarkerClick(l, 'lead')}
          icon={{
            url: `https://maps.google.com/mapfiles/ms/icons/yellow-dot.png`,
            scaledSize: new google.maps.Size(32, 32)
          }}
          opacity={selectedForRoute.has(l.id) ? 1 : 0.8}
        />
      ))}

      {activeMarker && (
        <InfoWindow
          position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
          onCloseClick={() => setActiveMarker(null)}
        >
          <MarkerInfoWindow 
            marker={activeMarker} 
            userPosition={userPosition}
            showDistance={showDistance}
            onToggleRoute={() => onToggleRoute(activeMarker.id)}
            isSelected={selectedForRoute.has(activeMarker.id)}
          />
        </InfoWindow>
      )}

      {activeTab === 'route' && selectedForRoute.size >= 2 && (
        <DirectionsService
          options={{
            origin: userPosition || { lat: clients[0].lat, lng: clients[0].lng },
            destination: { lat: clients[clients.length-1].lat, lng: clients[clients.length-1].lng },
            waypoints: [...clients, ...leads]
              .filter(i => selectedForRoute.has(i.id))
              .map(i => ({ location: { lat: i.lat, lng: i.lng }, stopover: true })),
            travelMode: google.maps.TravelMode.DRIVING
          }}
          callback={(result, status) => {
            if (status === 'OK' && result) {
              setDirections(result);
            }
          }}
        />
      )}

      {directions && activeTab === 'route' && (
        <DirectionsRenderer directions={directions} />
      )}
    </GoogleMap>
  );
}
