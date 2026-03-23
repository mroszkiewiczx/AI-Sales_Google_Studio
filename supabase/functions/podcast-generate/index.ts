// supabase/functions/podcast-generate/index.ts
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
    const { 
      workspace_id, title, style, description, duration_minutes, 
      segments_count, host_name, guest_name 
    } = body;

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

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
    const systemPrompt = `Jesteś ekspertem od produkcji podcastów biznesowych. Wygeneruj kompletny skrypt podcastu.
Tytuł: ${title}. Styl: ${style}. Długość: ${duration_minutes} min.
Opis: ${description}.
${segments_count} segmentów. Per segment: DOKŁADNIE 5 pytań i DOKŁADNIE 5 rozbudowanych treści.
Format JSON:
{
  "segments": [{ "title": string, "duration_min": number, "questions": string[5], "content": string[5] }],
  "full_script": string
}`;

    const userMessage = style === 'wywiad_edukacyjny_2_osoby' 
      ? `Prowadzący: ${host_name}, Gość: ${guest_name}. Wygeneruj dialog edukacyjny.`
      : `Wygeneruj skrypt w stylu ${style}.`;

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

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: episode, error: insertError } = await adminClient
      .from("podcast_episodes")
      .insert({
        workspace_id,
        title,
        style,
        description,
        duration_minutes,
        segments_count,
        host_name,
        guest_name,
        segments: result.segments,
        full_script: result.full_script,
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Audit log
    await adminClient.from("audit_logs").insert({
      workspace_id,
      user_id: user.id,
      action: "podcast_generated",
      entity_type: "podcast_episode",
      entity_id: episode.id,
      metadata: { style, segments_count, duration_minutes }
    });

    return new Response(JSON.stringify({ episode_id: episode.id, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
