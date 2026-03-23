// supabase/functions/gen-newsletter-generate/index.ts
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
    const { workspace_id, subject, context, tone, language } = body;
    
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
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
    const { data: brand } = await adminClient
      .from("brand_settings")
      .select("company_name, primary_color")
      .eq("workspace_id", workspace_id)
      .maybeSingle();

    const company_name = brand?.company_name || "Nasza Firma";
    const systemPrompt = `Jesteś ekspertem od email marketingu. 
Wygeneruj profesjonalny newsletter HTML dla firmy "${company_name}".
Temat: "${subject || "brak"}". Ton: ${tone || "Profesjonalny"}. Język: ${language || "pl"}.
Kontekst: ${context || "brak"}.
Zwróć WYŁĄCZNIE czysty JSON w formacie: { "subject": "Temat", "h1": "Nagłówek", "content_html": "Treść HTML", "cta_text": "Tekst przycisku" }
content_html: paragrafy HTML, max 300 słów, używaj <p>, <strong>, <em>.`;

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Wygeneruj newsletter na podstawie tematu: ${subject || "brak"}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    const newsletter = JSON.parse(result.choices[0].message.content);

    // Audit log
    await adminClient.from("audit_logs").insert({
      workspace_id,
      user_id: user.id,
      action: "newsletter_generated",
      entity_type: "newsletter_template",
      metadata: { subject: newsletter.subject }
    });

    return new Response(JSON.stringify(newsletter), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
