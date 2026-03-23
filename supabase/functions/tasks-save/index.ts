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
    const { workspace_id, task_id, title, task_type, status, priority, due_date, due_time, notes, account_id, contact_id, deal_id, owner_id } = body;
    
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

    let task;
    if (task_id) {
      const { data, error } = await adminClient
        .from("tasks")
        .update({
          title, task_type, status, priority, due_date, due_time, notes, account_id, contact_id, deal_id, owner_id,
          updated_by: user.id,
          completed_at: status === 'COMPLETED' ? new Date().toISOString() : null
        })
        .eq("id", task_id)
        .eq("workspace_id", workspace_id)
        .select()
        .single();
      if (error) throw error;
      task = data;
      await adminClient.from("audit_logs").insert({
        workspace_id, user_id: user.id, action: "task_updated", metadata: { task_id, task_type }
      });
    } else {
      const { data, error } = await adminClient
        .from("tasks")
        .insert({
          workspace_id, created_by: user.id, owner_id: owner_id || user.id,
          title, task_type, status, priority, due_date, due_time, notes, account_id, contact_id, deal_id,
          completed_at: status === 'COMPLETED' ? new Date().toISOString() : null
        })
        .select()
        .single();
      if (error) throw error;
      task = data;
      await adminClient.from("audit_logs").insert({
        workspace_id, user_id: user.id, action: "task_created", metadata: { task_id: task.id, task_type }
      });
    }

    // Fire and forget hubspot sync if needed
    // fetch(`${supabaseUrl}/functions/v1/hubspot-sync`, { method: 'POST', headers: { Authorization: authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id, task_id: task.id }) }).catch(console.error);

    return new Response(JSON.stringify({ task }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
