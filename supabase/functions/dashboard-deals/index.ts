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
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return jsonError("UNAUTHORIZED", "Authentication failed", 401);

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspace_id");
    if (!workspaceId) return jsonError("WORKSPACE_ID_REQUIRED", "workspace_id is required", 400);

    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "15"), 100);
    const sortBy = url.searchParams.get("sort_by") || "created_at";
    const sortAsc = url.searchParams.get("sort_dir") === "asc";
    const stages = url.searchParams.get("stages")?.split(",").filter(Boolean);
    const ownerId = url.searchParams.get("owner_id");
    const riskMin = url.searchParams.get("risk_min");
    const riskMax = url.searchParams.get("risk_max");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Membership + role check
    const { data: membership } = await admin.from("workspace_memberships")
      .select("roles(name)").eq("user_id", user.id).eq("workspace_id", workspaceId).single();
    if (!membership) return jsonError("FORBIDDEN", "Not a member of this workspace", 403);

    const role = (membership as any).roles?.name;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Select with joined account + owner profile
    let q = admin.from("deals")
      .select(`
        id, name, stage, amount, weighted_amount, close_date,
        risk_score, next_step, last_activity_at, owner_id,
        accounts(name),
        profiles!deals_owner_id_fkey(display_name, email)
      `, { count: "exact" })
      .eq("workspace_id", workspaceId);

    if (role === "rep") q = q.or(`owner_id.eq.${user.id},created_by.eq.${user.id}`);
    if (stages?.length) q = q.in("stage", stages);
    if (ownerId) q = q.eq("owner_id", ownerId);
    if (riskMin) q = q.gte("risk_score", parseInt(riskMin));
    if (riskMax) q = q.lte("risk_score", parseInt(riskMax));

    const validSort = ["created_at", "amount", "close_date", "risk_score", "last_activity_at", "name", "stage"];
    const actualSort = validSort.includes(sortBy) ? sortBy : "created_at";
    q = q.order(actualSort, { ascending: sortAsc }).range(from, to);

    const { data: deals, count, error } = await q;
    if (error) {
      console.error("Query error:", error);
      return jsonError("INTERNAL_ERROR", "Failed to fetch deals", 500);
    }

    return new Response(JSON.stringify({
      data: deals || [],
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[dashboard-deals]", err);
    return jsonError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
});
