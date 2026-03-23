import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { workspace_id, export_type } = await req.json();
    if (!workspace_id) return json({ error: "workspace_id required" }, 400);

    const { data: isMember } = await userClient.rpc("is_workspace_member", { ws_id: workspace_id });
    if (!isMember) return json({ error: "Forbidden" }, 403);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create export job record
    const { data: job, error: jobErr } = await admin.from("export_jobs").insert({
      workspace_id,
      type: export_type || "dashboard_deals",
      status: "pending",
      user_id: user.id,
      created_by: user.id,
      config: { export_type },
    }).select("id").single();

    if (jobErr) return json({ error: "Failed to create export job" }, 500);

    // Audit log + n8n webhook trigger
    await admin.from("audit_logs").insert({
      workspace_id,
      user_id: user.id,
      action: "export_requested",
      entity_type: "export_job",
      entity_id: job.id,
      webhook_event_type: "dashboard.export_requested",
      metadata: { export_type, job_id: job.id },
    });

    return json({ job_id: job.id, status: "pending" });

  } catch (err) {
    console.error("[dashboard-export]", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
