// supabase/functions/transcript-clean/index.ts
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
    const { workspace_id, transcript_id } = body;
    if (!workspace_id || !transcript_id) {
      return new Response(JSON.stringify({ error: "workspace_id and transcript_id required" }), {
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
    
    const { data: transcript, error: transcriptError } = await adminClient
      .from("transcripts")
      .select("content")
      .eq("id", transcript_id)
      .single();

    if (transcriptError || !transcript) {
      return new Response(JSON.stringify({ error: "Transcript not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
    const systemPrompt = `Wyczyść transkrypcję z wypełniaczy: 'yyyy', 'eee', 'hmm', 'yyy', 'no', 'ee'.
Usuń niepotrzebne pauzy i powtórzenia. Zachowaj treść merytoryczną.
Zwróć oczyszczony tekst. Zachowaj etykiety PROWADZĄCY/KLIENT.`;

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
          { role: "user", content: transcript.content },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) throw new Error(await aiResponse.text());
    const aiData = await aiResponse.json();
    const cleaned = aiData.choices[0].message.content;

    await adminClient
      .from("transcripts")
      .update({ content: cleaned })
      .eq("id", transcript_id);

    return new Response(JSON.stringify({ transcript_id, word_count: cleaned.split(/\s+/).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
