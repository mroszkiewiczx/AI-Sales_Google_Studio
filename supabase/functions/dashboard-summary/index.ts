import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonError(code: string, message: string, status: number) {
  return new Response(JSON.stringify({ error: message, error_code: code }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("UNAUTHORIZED", "Missing authorization header", 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return jsonError("UNAUTHORIZED", "Authentication failed", 401);

    // workspace_id from query string or body
    const url = new URL(req.url);
    let workspaceId = url.searchParams.get("workspace_id");
    if (!workspaceId && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      workspaceId = body?.workspace_id;
    }
    if (!workspaceId) return jsonError("WORKSPACE_ID_REQUIRED", "workspace_id is required", 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Membership + role check
    const { data: membership, error: memErr } = await admin
      .from("workspace_memberships")
      .select("id, roles(name)")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (memErr || !membership) return jsonError("FORBIDDEN", "Not a member of this workspace", 403);
    const role = (membership as any).roles?.name;
    const ownerFilter = role === "rep" ? user.id : null;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    const staleThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Pipeline value
    let pipelineQ = admin.from("deals").select("amount, weighted_amount")
      .eq("workspace_id", workspaceId).not("stage", "in", "(closed_won,closed_lost)");
    if (ownerFilter) pipelineQ = pipelineQ.eq("owner_id", ownerFilter);
    const { data: pipelineDeals } = await pipelineQ;
    const pipelineValue = (pipelineDeals || []).reduce((s, d) => s + Number(d.amount || 0), 0);
    const weightedPipeline = (pipelineDeals || []).reduce((s, d) => s + Number(d.weighted_amount || 0), 0);

    // Deals closing this month
    let closingQ = admin.from("deals").select("id", { count: "exact" })
      .eq("workspace_id", workspaceId).not("stage", "in", "(closed_won,closed_lost)")
      .gte("close_date", monthStart).lte("close_date", monthEnd);
    if (ownerFilter) closingQ = closingQ.eq("owner_id", ownerFilter);
    const { count: dealsClosingThisMonth } = await closingQ;

    // Tasks due today
    let tasksQ = admin.from("tasks").select("id", { count: "exact" })
      .eq("workspace_id", workspaceId).neq("status", "COMPLETED").neq("status", "DEFERRED")
      .gte("due_date", todayStart).lte("due_date", todayEnd);
    if (ownerFilter) tasksQ = tasksQ.eq("owner_id", ownerFilter);
    const { count: tasksDueToday } = await tasksQ;

    // Stale deals
    let staleQ = admin.from("deals").select("id", { count: "exact" })
      .eq("workspace_id", workspaceId).not("stage", "in", "(closed_won,closed_lost)")
      .lt("last_activity_at", staleThreshold);
    if (ownerFilter) staleQ = staleQ.eq("owner_id", ownerFilter);
    const { count: staleDeals } = await staleQ;

    // Meetings without briefing (future)
    let meetingsQ = admin.from("calendar_events").select("id", { count: "exact" })
      .eq("workspace_id", workspaceId).eq("has_briefing", false)
      .gte("start_at", now.toISOString());
    if (ownerFilter) meetingsQ = meetingsQ.eq("owner_id", ownerFilter);
    const { count: meetingsWithoutBriefing } = await meetingsQ;

    // Lead inflow by source (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: leadsRaw } = await admin.from("leads").select("source")
      .eq("workspace_id", workspaceId).gte("created_at", thirtyDaysAgo);
    const leadsBySource: Record<string, number> = {};
    (leadsRaw || []).forEach(l => {
      const src = l.source || "unknown";
      leadsBySource[src] = (leadsBySource[src] || 0) + 1;
    });

    // Forecast vs target
    let forecastQ = admin.from("deals").select("weighted_amount")
      .eq("workspace_id", workspaceId).gte("close_date", monthStart).lte("close_date", monthEnd);
    if (ownerFilter) forecastQ = forecastQ.eq("owner_id", ownerFilter);
    const { data: forecastDeals } = await forecastQ;
    const forecastValue = (forecastDeals || []).reduce((s, d) => s + Number(d.weighted_amount || 0), 0);

    // Unread notifications for user
    const { count: unreadCount } = await admin.from("notifications").select("id", { count: "exact" })
      .eq("workspace_id", workspaceId).eq("user_id", user.id).eq("read", false);

    return new Response(JSON.stringify({
      pipeline_value: pipelineValue,
      weighted_pipeline: weightedPipeline,
      deals_closing_this_month: dealsClosingThisMonth || 0,
      unread_emails: unreadCount || 0,
      tasks_due_today: tasksDueToday || 0,
      stale_deals: staleDeals || 0,
      meetings_without_briefing: meetingsWithoutBriefing || 0,
      lead_inflow_by_source: leadsBySource,
      forecast_value: forecastValue,
      forecast_target: 100000,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[dashboard-summary]", err);
    return jsonError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
});
