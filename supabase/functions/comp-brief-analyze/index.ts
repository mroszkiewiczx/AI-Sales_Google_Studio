// supabase/functions/comp-brief-analyze/index.ts
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

    const { workspace_id, competitor_id } = await req.json();
    if (!workspace_id || !competitor_id) {
      return new Response(JSON.stringify({ error: "workspace_id and competitor_id required" }), {
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
    const { data: competitor, error: fetchError } = await adminClient
      .from("competition_tracking")
      .select("*")
      .eq("id", competitor_id)
      .eq("workspace_id", workspace_id)
      .single();

    if (fetchError || !competitor) throw fetchError || new Error("Competitor not found");

    const serpapiKey = Deno.env.get("SERPAPI_KEY");
    let searchResults = [];

    if (serpapiKey) {
      const queries = [];
      if (competitor.monitor_articles) queries.push(`${competitor.competitor_name} news OR blog site:${competitor.competitor_url || ''}`);
      if (competitor.monitor_pricing) queries.push(`${competitor.competitor_name} cennik OR pricing OR ceny`);
      if (competitor.monitor_social) queries.push(`${competitor.competitor_name} site:linkedin.com OR site:facebook.com`);
      if (competitor.monitor_jobs) queries.push(`${competitor.competitor_name} oferty pracy site:pracuj.pl OR site:linkedin.com`);

      for (const q of queries) {
        const res = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(q)}&api_key=${serpapiKey}`);
        const data = await res.json();
        searchResults.push({ query: q, results: data.organic_results || [] });
      }
    }

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
    const systemPrompt = `Przeanalizuj wyniki wyszukiwania dla konkurenta ${competitor.competitor_name}.
Wyciągnij: artykuły (title/url/snippet/sentiment), zmiany cen, aktywność social, oferty pracy.
Zwróć TYLKO czysty JSON w formacie:
{
  "summary": "krótkie podsumowanie",
  "articles": [{ "title": string, "url": string, "published_at": string, "snippet": string, "sentiment": "pozytywny"|"neutralny"|"negatywny" }],
  "pricing_changes": [{ "description": string, "detected_at": string, "url": string }],
  "social_activity": [{ "platform": string, "content": string, "url": string, "engagement": string }],
  "job_postings": [{ "title": string, "url": string, "location": string }]
}`;

    const userMessage = searchResults.length > 0 
      ? `Oto wyniki wyszukiwania: ${JSON.stringify(searchResults)}`
      : `Brak wyników z wyszukiwarki. Użyj swojej wiedzy o firmie ${competitor.competitor_name} i branży ${competitor.industry || 'IT/SaaS'}. Dodaj disclaimer, że dane mogą być nieaktualne.`;

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

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    const { data: analysisResult, error: insertError } = await adminClient
      .from("competitor_results")
      .insert({
        workspace_id,
        competitor_id,
        summary: result.summary,
        articles: result.articles,
        pricing_changes: result.pricing_changes,
        social_activity: result.social_activity,
        job_postings: result.job_postings
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await adminClient
      .from("competition_tracking")
      .update({ last_analyzed_at: new Date().toISOString() })
      .eq("id", competitor_id);

    // Audit log
    await adminClient.from("audit_logs").insert({
      workspace_id,
      user_id: user.id,
      action: "competitor_analyzed",
      entity_type: "competition_tracking",
      entity_id: competitor_id,
      metadata: { competitor_name: competitor.competitor_name, articles_count: result.articles?.length || 0 }
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
