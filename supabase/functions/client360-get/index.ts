// supabase/functions/client360-get/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const body = await req.json();
    const { workspace_id, account_id } = body;
    if (!workspace_id || !account_id) return new Response(JSON.stringify({ error: "workspace_id and account_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isMember } = await userClient.rpc("is_workspace_member", { target_workspace_id: workspace_id });
    if (!isMember) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Agregacja danych
    const [
      { data: account },
      { data: contacts },
      { data: deals },
      { data: emails },
      { data: calls },
      { data: tasks },
      { data: analyses },
      { data: lastScore }
    ] = await Promise.all([
      adminClient.from("accounts").select("*").eq("id", account_id).single(),
      adminClient.from("contacts").select("*").eq("account_id", account_id),
      adminClient.from("deals").select("*").eq("account_id", account_id),
      adminClient.from("emails").select("*").eq("account_id", account_id).order("created_at", { ascending: false }),
      adminClient.from("calls").select("*").eq("account_id", account_id).order("created_at", { ascending: false }),
      adminClient.from("tasks").select("*").eq("account_id", account_id).order("created_at", { ascending: false }),
      adminClient.from("ai_analyses").select("*").eq("account_id", account_id).order("created_at", { ascending: false }),
      adminClient.from("client360_scores").select("*").eq("account_id", account_id).order("created_at", { ascending: false }).limit(1).single()
    ]);

    // Statystyki pipeline
    const pipeline = {
      lead: deals?.filter(d => d.stage === "lead").length || 0,
      meeting: deals?.filter(d => d.stage === "meeting").length || 0,
      proposal: deals?.filter(d => d.stage === "proposal").length || 0,
      closing: deals?.filter(d => d.stage === "closing").length || 0,
    };

    return new Response(JSON.stringify({
      account,
      contacts,
      deals,
      emails,
      calls,
      tasks,
      analyses,
      pipeline,
      lastScore
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
