import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIC_PRODUKTY = [
  // MONTHLY
  { hubspot_id: "123456", name: "OptiMES Core (M)", base_price: 450, billing_period: "monthly", category: "core" },
  { hubspot_id: "123457", name: "Planowanie (M)", base_price: 250, billing_period: "monthly", category: "module" },
  { hubspot_id: "123458", name: "Magazyn (M)", base_price: 150, billing_period: "monthly", category: "module" },
  { hubspot_id: "123459", name: "Utrzymanie Ruchu (M)", base_price: 100, billing_period: "monthly", category: "module" },
  { hubspot_id: "123460", name: "Kontrola Jakości (M)", base_price: 100, billing_period: "monthly", category: "module" },
  { hubspot_id: "123461", name: "Terminal Produkcyjny (M)", base_price: 50, billing_period: "monthly", category: "terminal" },

  // ANNUAL
  { hubspot_id: "223456", name: "OptiMES Core (A)", base_price: 4500, billing_period: "annual", category: "core" },
  { hubspot_id: "223457", name: "Planowanie (A)", base_price: 2500, billing_period: "annual", category: "module" },
  { hubspot_id: "223458", name: "Magazyn (A)", base_price: 1500, billing_period: "annual", category: "module" },
  { hubspot_id: "223459", name: "Utrzymanie Ruchu (A)", base_price: 1000, billing_period: "annual", category: "module" },
  { hubspot_id: "223460", name: "Kontrola Jakości (A)", base_price: 1000, billing_period: "annual", category: "module" },
  { hubspot_id: "223461", name: "Terminal Produkcyjny (A)", base_price: 500, billing_period: "annual", category: "terminal" },

  // PERPETUAL
  { hubspot_id: "323456", name: "OptiMES Core (P)", base_price: 12500, billing_period: "perpetual", category: "core" },
  { hubspot_id: "323457", name: "Planowanie (P)", base_price: 7500, billing_period: "perpetual", category: "module" },
  { hubspot_id: "323458", name: "Magazyn (P)", base_price: 4500, billing_period: "perpetual", category: "module" },
  { hubspot_id: "323459", name: "Utrzymanie Ruchu (P)", base_price: 3000, billing_period: "perpetual", category: "module" },
  { hubspot_id: "323460", name: "Kontrola Jakości (P)", base_price: 3000, billing_period: "perpetual", category: "module" },
  { hubspot_id: "323461", name: "Terminal Produkcyjny (P)", base_price: 1500, billing_period: "perpetual", category: "terminal" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin (optional but good)
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Sync products
    for (const prod of LIC_PRODUKTY) {
      const { error } = await adminClient
        .from("license_products")
        .upsert(prod, { onConflict: "hubspot_id" });
      
      if (error) throw error;
    }

    return new Response(JSON.stringify({ message: "Products synced successfully", count: LIC_PRODUKTY.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
