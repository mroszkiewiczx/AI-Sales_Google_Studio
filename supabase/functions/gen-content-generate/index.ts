// supabase/functions/gen-content-generate/index.ts
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
    const { workspace_id, title, base_content, channels, tone, goal, context, hashtags } = body;
    
    if (!workspace_id || !title || !channels || !channels.length) {
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

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    
    const generatePostForChannel = async (channel: string) => {
      const systemPrompt = `Jesteś ekspertem od social media copywritingu. 
Napisz 2 różne warianty posta na ${channel} o tytule: "${title}".
Ton: ${tone}. Cel: ${goal}. Kontekst: ${context || "brak"}.
Dostosuj format, długość, emoji do specyfiki ${channel}.
${hashtags ? "Dodaj 5-10 trafnych #hashtagów." : ""}
Zwróć WYŁĄCZNIE czysty JSON w formacie: { "variant1": "treść 1", "variant2": "treść 2" }`;

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
            { role: "user", content: `Treść bazowa: ${base_content || "brak"}` }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) throw new Error(`OpenRouter error for ${channel}: ${await response.text()}`);
      const result = await response.json();
      const variants = JSON.parse(result.choices[0].message.content);
      return { channel, ...variants };
    };

    const posts = await Promise.all(channels.map((ch: string) => generatePostForChannel(ch)));

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: generation, error: insertError } = await adminClient
      .from("content_generations")
      .insert({
        workspace_id,
        title,
        base_content,
        tone,
        goal,
        channels,
        hashtags,
        posts,
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Audit log
    await adminClient.from("audit_logs").insert({
      workspace_id,
      user_id: user.id,
      action: "content_generated",
      entity_type: "content_generation",
      entity_id: generation.id,
      metadata: { channels, post_count: channels.length }
    });

    return new Response(JSON.stringify({ generation_id: generation.id, posts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
