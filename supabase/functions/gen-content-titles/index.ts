// supabase/functions/gen-content-titles/index.ts
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
    const { workspace_id, title_or_url, context } = body;
    
    if (!workspace_id || !title_or_url) {
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
    const { data: settings } = await adminClient
      .from("content_settings")
      .select("tone, language")
      .eq("workspace_id", workspace_id)
      .maybeSingle();

    const tone = settings?.tone || "Profesjonalny";
    const language = settings?.language || "pl";

    const systemPrompt = `Jesteś ekspertem od social media copywritingu. 
Twoim zadaniem jest wygenerowanie 5 angażujących tytułów do posta na podstawie podanego tematu lub linku.
Język: ${language}. Ton: ${tone}. Każdy tytuł max 80 znaków.
Zwróć WYŁĄCZNIE czysty JSON w formacie: { "titles": ["tytuł 1", "tytuł 2", ...] }`;

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Temat/URL: ${title_or_url}\nDodatkowy kontekst: ${context || "brak"}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    const titles = JSON.parse(result.choices[0].message.content).titles;

    return new Response(JSON.stringify({ titles }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
