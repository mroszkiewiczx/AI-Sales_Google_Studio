// supabase/functions/client360-score/index.ts
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

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { workspace_id, account_id } = body;
    if (!workspace_id || !account_id) return new Response(JSON.stringify({ error: "workspace_id and account_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isMember } = await userClient.rpc("is_workspace_member", { target_workspace_id: workspace_id });
    if (!isMember) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Pobierz dane do analizy
    const [
      { data: account },
      { data: deals },
      { data: emails },
      { data: calls },
      { data: tasks },
      { data: analyses }
    ] = await Promise.all([
      adminClient.from("accounts").select("*").eq("id", account_id).single(),
      adminClient.from("deals").select("*").eq("account_id", account_id),
      adminClient.from("emails").select("*").eq("account_id", account_id).order("created_at", { ascending: false }).limit(10),
      adminClient.from("calls").select("*").eq("account_id", account_id).order("created_at", { ascending: false }).limit(10),
      adminClient.from("tasks").select("*").eq("account_id", account_id).order("created_at", { ascending: false }).limit(10),
      adminClient.from("ai_analyses").select("*").eq("account_id", account_id).order("created_at", { ascending: false }).limit(5)
    ]);

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
    const systemPrompt = `Jesteś ekspertem sprzedaży B2B. Przeanalizuj dane klienta i wystaw ocenę scoringową.
Zwróć JSON: {
  "win_probability": number (0-100),
  "label": string ("Gorący", "Obiecujący", "Zimny"),
  "description": string (krótkie uzasadnienie),
  "actions": string[] (3 konkretne kroki),
  "risks": string[] (3 główne ryzyka)
}`;

    const context = JSON.stringify({ account, deals, emails, calls, tasks, analyses });

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
          { role: "user", content: context },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) throw new Error(await aiResponse.text());
    const aiData = await aiResponse.json();
    const score = JSON.parse(aiData.choices[0].message.content);

    // Zapisz wynik
    const { data: savedScore, error: saveError } = await adminClient
      .from("client360_scores")
      .insert({
        workspace_id,
        account_id,
        created_by: user.id,
        win_probability: score.win_probability,
        label: score.label,
        description: score.description,
        actions: score.actions,
        risks: score.risks,
        model_used: "google/gemini-2.0-flash-001",
        prompt_tokens: aiData.usage?.prompt_tokens,
        completion_tokens: aiData.usage?.completion_tokens,
        cost_usd: (aiData.usage?.total_tokens || 0) * 0.0000001 // uproszczony koszt
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Aktualizuj prawdopodobieństwo w dealach (uproszczenie)
    await adminClient
      .from("deals")
      .update({ probability: score.win_probability })
      .eq("account_id", account_id)
      .eq("status", "open");

    // Log zdarzenia
    await adminClient.from("audit_logs").insert({
      workspace_id,
      user_id: user.id,
      action: "client360_score_generated",
      resource_type: "account",
      resource_id: account_id,
      metadata: { score_id: savedScore.id, probability: score.win_probability }
    });

    return new Response(JSON.stringify(savedScore), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
