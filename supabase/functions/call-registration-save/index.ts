import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { workspace_id, account_id, contact_id, deal_id, called_at, duration_seconds, outcome, direction, phone_number, notes } = body;
    
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "workspace_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isMember } = await userClient.rpc("is_workspace_member", { ws_id: workspace_id });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: callReg, error: callError } = await adminClient
      .from("call_registrations")
      .insert({
        workspace_id, created_by: user.id, account_id, contact_id, deal_id,
        called_at, duration_seconds, outcome, direction, phone_number, notes
      })
      .select()
      .single();

    if (callError) throw callError;

    const { data: task, error: taskError } = await adminClient
      .from("tasks")
      .insert({
        workspace_id, created_by: user.id, owner_id: user.id,
        title: `Rozmowa telefoniczna: ${outcome}`,
        task_type: 'CALL',
        status: 'COMPLETED',
        completed_at: called_at,
        account_id, contact_id, deal_id,
        notes: `Call Registration ID: ${callReg.id}\n${notes || ''}`
      })
      .select()
      .single();

    if (taskError) throw taskError;

    await adminClient.from("call_registrations").update({ task_id: task.id }).eq("id", callReg.id);

    await adminClient.from("audit_logs").insert({
      workspace_id, user_id: user.id, action: "call_registered", metadata: { call_id: callReg.id, task_id: task.id }
    });

    return new Response(JSON.stringify({ call_id: callReg.id, task_id: task.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
