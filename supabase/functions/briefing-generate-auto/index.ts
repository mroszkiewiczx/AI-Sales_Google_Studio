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
    const { workspace_id, date } = body;
    
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
      return new Response(JSON.stringify({ error: "google_not_connected", briefs: [] }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const timeMin = `${targetDate}T00:00:00Z`;
    const timeMax = `${targetDate}T23:59:59Z`;

    const gcalRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${creds.access_token}` },
    });

    if (!gcalRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch from Google Calendar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gcalData = await gcalRes.json();
    const events = gcalData.items || [];
    
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
    
    const briefs = [];
    let synced_count = 0;

    for (const event of events) {
      if (!event.start?.dateTime) continue; // Skip all-day events for briefings
      
      const guestEmail = event.attendees?.find((a: any) => !a.self)?.email;
      const guestName = event.attendees?.find((a: any) => !a.self)?.displayName || guestEmail?.split('@')[0];
      const domain = guestEmail?.split('@')[1];

      let account_id = null;
      let deal_id = null;
      let bant_total = null;
      let crmData = "";

      if (domain || guestName) {
        let query = adminClient.from("accounts").select("id, name, domain").eq("workspace_id", workspace_id);
        if (domain) query = query.ilike("domain", `%${domain}%`);
        else if (guestName) query = query.ilike("name", `%${guestName}%`);
        
        const { data: accounts } = await query.limit(1);
        if (accounts && accounts.length > 0) {
          account_id = accounts[0].id;
          
          // Fetch CRM data (mocked for brevity, normally you'd fetch emails, calls, notes, deals)
          const { data: deals } = await adminClient.from("deals").select("id, name, stage, amount, bant_total").eq("account_id", account_id).limit(1);
          if (deals && deals.length > 0) {
            deal_id = deals[0].id;
            bant_total = deals[0].bant_total;
            crmData = `Deal: ${deals[0].name}, Stage: ${deals[0].stage}, Amount: ${deals[0].amount}, BANT: ${deals[0].bant_total}`;
          }
        }
      }

      const systemPrompt = "You are an AI Sales Assistant. Generate a meeting briefing JSON with: company_info, deal_stage, deal_value, summary, key_points (array), risks (array).";
      const userMessage = `Meeting: ${event.summary}\nGuest: ${guestName} (${guestEmail})\nCRM Data: ${crmData}`;

      const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://salesos.app",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      });
      
      let brief_content = {};
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        try {
          brief_content = JSON.parse(aiData.choices[0].message.content);
        } catch (e) {
          console.error("Failed to parse AI response", e);
        }
      }

      // Fetch 8 random questions
      const { data: questionsData } = await adminClient.from("quiz_questions").select("id, text").eq("is_active", true).limit(8);
      const questions = (questionsData || []).map((q: any) => ({ id: q.id, text: q.text, answered: false }));

      // Generate key alerts and history summary (mocked for now)
      const key_alerts = [{ type: 'blue', text: 'Upcoming meeting' }];
      const history_summary = [];

      const { data: brief, error: briefError } = await adminClient.from("meeting_briefs").insert({
        workspace_id,
        created_by: user.id,
        account_id,
        calendar_event_id: event.id,
        meeting_title: event.summary || "Bez tytułu",
        meeting_time: event.start.dateTime,
        meeting_duration_minutes: (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / 60000,
        contact_name: guestName,
        contact_email: guestEmail,
        mode: 'auto',
        bant_total,
        deal_id,
        brief_content,
        questions,
        key_alerts,
        history_summary,
        model_used: "google/gemini-2.5-flash"
      }).select().single();

      if (briefError) throw briefError;
      briefs.push(brief);
      synced_count++;
    }

    // Auto save to Notion if enabled
    const { data: settings } = await adminClient.from("briefing_settings").select("auto_save_notion").eq("workspace_id", workspace_id).eq("user_id", user.id).single();
    if (settings?.auto_save_notion) {
      // fire and forget notion save
      // fetch(`${supabaseUrl}/functions/v1/notion-save`, ...).catch(console.error);
    }

    return new Response(JSON.stringify({ briefs, synced_count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
