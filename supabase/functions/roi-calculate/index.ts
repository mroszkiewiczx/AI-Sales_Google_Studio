import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoiInputs {
  employees: number;
  hourly_rate: number;
  waste_minutes: number;
  inventory_value: number;
  inventory_opt_pct: number;
  annual_turnover: number;
  production_growth_pct: number;
  license_cost: number;
  implementation_cost: number;
  license_type: "subscription" | "license";
  license_years: number;
  lease_months: number;
  initial_payment_pct: number;
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
    const { workspace_id, inputs, save, deal_id, account_id } = body;

    if (!workspace_id || !inputs) {
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

    // LOGIKA (przepisana z roiCalc() JS dosłownie)
    const work_days = 21.5;
    const amort_rate = 0.08;
    const { 
      employees, hourly_rate, waste_minutes, inventory_value,
      inventory_opt_pct, annual_turnover, production_growth_pct,
      license_cost, implementation_cost, license_type, license_years,
      lease_months, initial_payment_pct 
    } = inputs as RoiInputs;

    const daily_cost = employees * (waste_minutes / 60) * hourly_rate;
    const annual_labor = daily_cost * work_days * 12;
    const freed_capital = inventory_value * (inventory_opt_pct / 100);
    const lost_profit = annual_turnover * (production_growth_pct / 100);
    const total_gain = annual_labor + freed_capital + lost_profit;
    const monthly_gain = total_gain / 12;

    const lic_total = license_type === "subscription"
      ? license_cost * license_years
      : license_cost;
    const invest_total = lic_total + implementation_cost;
    const payback_months = monthly_gain > 0 ? Math.ceil(invest_total / monthly_gain) : 0;
    const init_pay = invest_total * (initial_payment_pct / 100);
    const financed = invest_total - init_pay;
    const lease_total = financed * (1 + amort_rate);
    const lease_monthly = lease_months > 0 ? lease_total / lease_months : 0;

    const results = {
      annual_labor_loss: annual_labor,
      freed_capital,
      lost_profit,
      total_gain,
      invest_total,
      payback_months,
      monthly_gain,
      lease_monthly,
      lease_init_payment: init_pay,
    };

    let calculation_id = null;
    if (save) {
      const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data, error: saveError } = await adminClient
        .from("roi_calculations")
        .insert({
          workspace_id,
          created_by: user.id,
          deal_id,
          account_id,
          ...inputs,
          ...results
        })
        .select("id")
        .single();

      if (saveError) throw saveError;
      calculation_id = data.id;

      await adminClient.from("audit_logs").insert({
        workspace_id,
        user_id: user.id,
        action: "roi_calculated",
        entity_id: calculation_id,
        entity_type: "roi_calculation"
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
