import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LicenseItem {
  id: string;
  quantity: number;
  is_hidden: boolean;
}

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

    const body = await req.json();
    const { workspace_id, billing_period, multiplier, items, maintenance_override, save, deal_id, account_id } = body;

    if (!workspace_id || !billing_period || !multiplier || !items) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check membership
    const { data: isMember } = await userClient.rpc("is_workspace_member", { ws_id: workspace_id });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Fetch products
    const { data: products, error: productsError } = await adminClient
      .from("license_products")
      .select("*")
      .eq("billing_period", billing_period);

    if (productsError) throw productsError;

    let total_net = 0;
    let total_gross = 0;
    const calculated_items = [];

    for (const item of items as LicenseItem[]) {
      const product = products.find((p: any) => p.id === item.id);
      if (!product) continue;

      const base_price = product.base_price;
      const unit_price = base_price * multiplier;
      const line_total = unit_price * item.quantity;

      calculated_items.push({
        ...product,
        quantity: item.quantity,
        is_hidden: item.is_hidden,
        unit_price,
        line_total
      });

      if (!item.is_hidden) {
        total_net += line_total;
      }
    }

    // Maintenance for perpetual
    let maintenance_total = 0;
    if (billing_period === "perpetual") {
      maintenance_total = maintenance_override !== undefined 
        ? maintenance_override 
        : total_net * 0.22;
      total_net += maintenance_total;
    }

    total_gross = total_net * 1.23;

    const results = {
      total_net,
      total_gross,
      maintenance_total,
      items: calculated_items
    };

    let calculation_id = null;
    if (save) {
      const { data, error: saveError } = await adminClient
        .from("license_calculations")
        .insert({
          workspace_id,
          created_by: user.id,
          deal_id,
          account_id,
          billing_period,
          multiplier,
          items: calculated_items,
          total_net,
          total_gross,
          maintenance_total
        })
        .select("id")
        .single();

      if (saveError) throw saveError;
      calculation_id = data.id;

      await adminClient.from("audit_logs").insert({
        workspace_id,
        user_id: user.id,
        action: "license_calculated",
        entity_id: calculation_id,
        entity_type: "license_calculation"
      });
    }

    return new Response(JSON.stringify({ results, calculation_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
