// supabase/functions/gen-content-image/index.ts
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
    const { workspace_id, post_text, channel, generation_id } = body;
    
    if (!workspace_id || !post_text || !channel || !generation_id) {
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

    const size = (channel.includes("Instagram") || channel.includes("TikTok")) ? "1024x1024" : "1792x1024";
    const image_prompt = `${post_text.slice(0, 150)} — professional business style, ${channel} format`;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: image_prompt,
        n: 1,
        size: size,
        quality: "standard"
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    const imageUrl = result.data[0].url;

    // Upload to Supabase Storage
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const imageRes = await fetch(imageUrl);
    const blob = await imageRes.blob();
    const fileName = `${workspace_id}/${generation_id}/${channel.replace(/\s+/g, "_")}_${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("content-images")
      .upload(fileName, blob, { contentType: "image/png", upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = adminClient.storage.from("content-images").getPublicUrl(fileName);

    // Update content_generations
    const { data: genData } = await adminClient
      .from("content_generations")
      .select("posts")
      .eq("id", generation_id)
      .single();

    if (genData) {
      const updatedPosts = genData.posts.map((p: any) => {
        if (p.channel === channel) return { ...p, image_url: publicUrl };
        return p;
      });
      await adminClient
        .from("content_generations")
        .update({ posts: updatedPosts })
        .eq("id", generation_id);
    }

    return new Response(JSON.stringify({ image_url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
