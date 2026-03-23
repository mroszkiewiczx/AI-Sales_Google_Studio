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
    const { workspace_id, date_from, date_to } = body;
    
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

    // Fetch Google OAuth token
    const { data: creds, error: credsError } = await adminClient
      .from("integration_credentials")
      .select("access_token")
      .eq("workspace_id", workspace_id)
      .eq("provider", "google")
      .single();

    if (credsError || !creds?.access_token) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected", synced_count: 0 }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timeMin = date_from ? new Date(date_from).toISOString() : new Date().toISOString();
    const timeMax = date_to ? new Date(date_to).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const gcalRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`, {
      headers: { Authorization: `Bearer ${creds.access_token}` },
    });

    if (!gcalRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch from Google Calendar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gcalData = await gcalRes.json();
    const events = gcalData.items || [];

    let synced_count = 0;
    let new_count = 0;

    for (const event of events) {
      if (!event.start?.dateTime && !event.start?.date) continue;
      
      const startDate = event.start.dateTime || event.start.date;
      const title = event.summary || "Bez tytułu";
      
      const { data: existing } = await adminClient
        .from("tasks")
        .select("id")
        .eq("workspace_id", workspace_id)
        .eq("gcal_event_id", event.id)
        .single();

      if (existing) {
        await adminClient.from("tasks").update({
          title,
          due_date: startDate.split('T')[0],
          due_time: startDate.includes('T') ? startDate.split('T')[1].substring(0, 5) : null,
          updated_by: user.id,
        }).eq("id", existing.id);
        synced_count++;
      } else {
        await adminClient.from("tasks").insert({
          workspace_id,
          created_by: user.id,
          owner_id: user.id,
          title,
          task_type: 'MEETING_GCAL',
          source: 'gcal',
          gcal_event_id: event.id,
          due_date: startDate.split('T')[0],
          due_time: startDate.includes('T') ? startDate.split('T')[1].substring(0, 5) : null,
        });
        new_count++;
        synced_count++;
      }
    }

    return new Response(JSON.stringify({ synced_count, new_count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
