import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WDR_PRODUKTY = [
  { group: "Przygotowanie", name: "Analiza przedwdrożeniowa", desc: "Warsztaty, mapowanie procesów, dokumentacja", model: "Jednorazowo", price: 4500, hubspot_id: "261061910701" },
  { group: "Przygotowanie", name: "Instalacja i konfiguracja środowiska", desc: "Serwer, baza danych, dostęp zdalny", model: "Jednorazowo", price: 1200, hubspot_id: "261061910702" },
  { group: "Konfiguracja", name: "Konfiguracja modułu Produkcja", desc: "Zlecenia, technologie, marszruty", model: "Jednorazowo", price: 3500, hubspot_id: "261061910703" },
  { group: "Konfiguracja", name: "Konfiguracja modułu Magazyn", desc: "Struktura, partie, kody kreskowe", model: "Jednorazowo", price: 2800, hubspot_id: "261061910704" },
  { group: "Konfiguracja", name: "Konfiguracja modułu Planowanie (APS)", desc: "Gantt, algorytmy, wąskie gardła", model: "Jednorazowo", price: 4200, hubspot_id: "261061910705" },
  { group: "Integracje", name: "Integracja z systemem ERP", desc: "Import kartotek, eksport dokumentów", model: "Jednorazowo", price: 6000, hubspot_id: "261061910706" },
  { group: "Integracje", name: "Integracja z maszynami (IoT)", desc: "Sygnały PLC, liczniki, czasy", model: "Jednorazowo", price: 8500, hubspot_id: "261061910707" },
  { group: "Szkolenia", name: "Szkolenie kluczowych użytkowników", desc: "Panel admina, konfiguracja", model: "Jednorazowo", price: 1500, hubspot_id: "261061910708" },
  { group: "Szkolenia", name: "Szkolenie operatorów (produkcja)", desc: "Obsługa terminali, meldowanie", model: "Jednorazowo", price: 1200, hubspot_id: "261061910709" },
  { group: "Utrzymanie", name: "Opieka powdrożeniowa (SLA Standard)", desc: "Wsparcie techniczne, aktualizacje", model: "Miesięcznie", price: 800, hubspot_id: "261061910710" },
  { group: "Utrzymanie", name: "Opieka powdrożeniowa (SLA Premium)", desc: "Czas reakcji 4h, dedykowany opiekun", model: "Miesięcznie", price: 1500, hubspot_id: "261061910711" },
  { group: "Utrzymanie", name: "Dzierżawa terminali produkcyjnych", desc: "Zestaw: tablet + obudowa + zasilacz", model: "Miesięcznie", price: 150, hubspot_id: "261061910712" },
  { group: "Inne", name: "Koszty dojazdu i delegacji", desc: "Ryczałt za wizytę u klienta", model: "Jednorazowo", price: 400, hubspot_id: "261061910713" },
  { group: "Inne", name: "Dostosowanie raportów (Custom BI)", desc: "Dodatkowe widoki, dashboardy", model: "Jednorazowo", price: 2500, hubspot_id: "261061910714" }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Clear existing products (optional, or upsert)
    // For simplicity, we'll just upsert by name
    for (const prod of WDR_PRODUKTY) {
      const { error } = await supabase
        .from('implementation_products')
        .upsert({
          name: prod.name,
          description: prod.desc,
          group_name: prod.group,
          model: prod.model,
          base_price: prod.price,
          hubspot_id: prod.hubspot_id
        }, { onConflict: 'name' })
      
      if (error) throw error
    }

    return new Response(
      JSON.stringify({ message: 'Products synced successfully', count: WDR_PRODUKTY.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
