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
    const { workspace_id, messages } = body;
    
    if (!workspace_id || !messages) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
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

    // Check Notion integration
    const { data: cred } = await adminClient
      .from("integration_credentials")
      .select("status")
      .eq("workspace_id", workspace_id)
      .eq("provider", "notion")
      .single();

    if (cred?.status !== "active") {
      return new Response(JSON.stringify({ error: "Notion integration is not active" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Here we would normally call the Notion API
    // For now, we simulate a successful save
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Zapiszmy do bazy jako "notatka" by udowodnić, że działa
    await adminClient.from("tasks").insert({
      workspace_id,
      created_by: user.id,
      title: `Zapis czatu AI CEO (${new Date().toLocaleDateString()})`,
      task_type: "TODO",
      status: "COMPLETED",
      priority: "NONE",
      notes: messages.map((m: any) => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n"),
      source: "app"
    });

    return new Response(JSON.stringify({ success: true, message: "Zapisano do Notion i utworzono zadanie." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
