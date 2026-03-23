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
    const { workspace_id, query, paste_text, account_id } = body;
    
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "workspace_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isMember } = await userClient.rpc("is_workspace_member", { target_workspace_id: workspace_id });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (query && !paste_text && !account_id) {
      const { data: accounts } = await adminClient
        .from("accounts")
        .select("id, name, domain")
        .eq("workspace_id", workspace_id)
        .ilike("name", `%${query}%`)
        .limit(5);
      return new Response(JSON.stringify({ accounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let crmData = "";
    let bant_total = null;
    let deal_id = null;
    let contact_name = null;
    let contact_email = null;

    if (account_id) {
      const { data: deals } = await adminClient.from("deals").select("id, name, stage, amount, bant_total").eq("account_id", account_id).limit(1);
      if (deals && deals.length > 0) {
        deal_id = deals[0].id;
        bant_total = deals[0].bant_total;
        crmData = `Deal: ${deals[0].name}, Stage: ${deals[0].stage}, Amount: ${deals[0].amount}, BANT: ${deals[0].bant_total}`;
      }
    }

    if (paste_text) {
      // Server-side regex parsing
      const emailMatch = paste_text.match(/\S+@\S+/);
      const phoneMatch = paste_text.match(/\+48\d{9}/);
      const budgetMatch = paste_text.match(/\d+\s*PLN/);
      const timelineMatch = paste_text.match(/Q[1-4]|kwartał/i);
      
      if (emailMatch) contact_email = emailMatch[0];
      if (phoneMatch) crmData += `\nPhone: ${phoneMatch[0]}`;
      if (budgetMatch) crmData += `\nBudget: ${budgetMatch[0]}`;
      if (timelineMatch) crmData += `\nTimeline: ${timelineMatch[0]}`;
      crmData += `\nText: ${paste_text}`;
    }

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
    const systemPrompt = "You are an AI Sales Assistant. Generate a meeting briefing JSON with: company_info, deal_stage, deal_value, summary, key_points (array), risks (array).";
    const userMessage = `CRM Data: ${crmData}`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://salesos.app",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
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

    const { data: questionsData } = await adminClient.from("quiz_questions").select("id, text").eq("is_active", true).limit(8);
    const questions = (questionsData || []).map((q: any) => ({ id: q.id, text: q.text, answered: false }));

    const key_alerts = [{ type: 'blue', text: 'Manual briefing' }];
    const history_summary = [];

    const { data: brief, error: briefError } = await adminClient.from("meeting_briefs").insert({
      workspace_id,
      created_by: user.id,
      account_id,
      meeting_title: "Ręczny Briefing",
      meeting_time: new Date().toISOString(),
      contact_name,
      contact_email,
      mode: 'manual',
      bant_total,
      deal_id,
      brief_content,
      questions,
      key_alerts,
      history_summary,
      model_used: "google/gemini-2.0-flash-001"
    }).select().single();

    if (briefError) throw briefError;

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
