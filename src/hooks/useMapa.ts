// src/hooks/useMapa.ts
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface ClientMarker {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  deal_status?: string;
  deal_value?: number;
  bant_total?: number;
  google_rating?: number;
}

export interface LeadMarker {
  id: string; // Alias for place_id
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviews_count: number;
  phone?: string;
  website?: string;
}

export function useMapsKey() {
  const { currentWorkspace } = useWorkspace();
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    
    const fetchKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('maps-key', {
          body: { workspace_id: currentWorkspace.id }
        });
        if (error) throw error;
        setKey(data.key);
      } catch (err: any) {
        console.error("Failed to fetch maps key:", err);
        setError('no_key');
      }
    };
    
    fetchKey();
  }, [currentWorkspace?.id]);

  return { key, error };
}

export function useMapData() {
  const { currentWorkspace } = useWorkspace();
  
  return useQuery({
    queryKey: ['maps-data', currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('maps-data', {
        body: { workspace_id: currentWorkspace!.id }
      });
      if (error) throw error;
      const clients = (data.clients || []).map((c: any) => ({ ...c, id: c.id || c.account_id }));
      const leads = (data.leads || []).map((l: any) => ({ ...l, id: l.place_id }));
      return { clients, leads };
    },
    enabled: !!currentWorkspace?.id
  });
}

export function useGeolocation() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolokacja niedostępna w tej przeglądarce');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Nie udało się pobrać lokalizacji')
    );
  };

  return { position, error, requestGPS };
}

export function useGeocodeAddress() {
  const { currentWorkspace } = useWorkspace();
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { account_id: string; address: string }) => {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { lat: number; lng: number };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maps-data', currentWorkspace?.id] })
  });
}
