// supabase/functions/gen-content-notion-save/index.ts
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
    const { workspace_id, generation_id, post_indices } = body;
    
    if (!workspace_id || !generation_id || !post_indices || !post_indices.length) {
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
    
    // Pobierz Notion token z integration_credentials
    const { data: cred } = await adminClient
      .from("integration_credentials")
      .select("access_token, settings")
      .eq("workspace_id", workspace_id)
      .eq("provider", "notion")
      .single();

    if (!cred?.access_token) {
      return new Response(JSON.stringify({ error: "Notion integration not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notion_database_id = cred.settings?.database_id;
    if (!notion_database_id) {
      return new Response(JSON.stringify({ error: "Notion database ID not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: genData } = await adminClient
      .from("content_generations")
      .select("*")
      .eq("id", generation_id)
      .single();

    if (!genData) throw new Error("Generation not found");

    const saveToNotion = async (postIndex: number) => {
      const post = genData.posts[postIndex];
      const content = post.selected_variant === 2 ? post.variant2 : post.variant1;
      
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cred.access_token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id: notion_database_id },
          properties: {
            Name: { title: [{ text: { content: genData.title } }] },
            Channel: { select: { name: post.channel } },
            Status: { status: { name: "Draft" } },
          },
          children: [
            {
              object: "block",
              type: "paragraph",
              paragraph: { rich_text: [{ type: "text", text: { content } }] },
            },
            ...(post.image_url ? [{
              object: "block",
              type: "image",
              image: { type: "external", external: { url: post.image_url } }
            }] : [])
          ],
        }),
      });

      if (!response.ok) throw new Error(`Notion error: ${await response.text()}`);
      const result = await response.json();
      return { index: postIndex, url: result.url };
    };

    const saved = await Promise.all(post_indices.map((idx: number) => saveToNotion(idx)));

    // Update content_generations posts z notion_page_url
    const updatedPosts = [...genData.posts];
    saved.forEach(s => {
      updatedPosts[s.index] = { ...updatedPosts[s.index], notion_page_url: s.url };
    });

    await adminClient
      .from("content_generations")
      .update({ posts: updatedPosts })
      .eq("id", generation_id);

    // Audit log
    await adminClient.from("audit_logs").insert({
      workspace_id,
      user_id: user.id,
      action: "content_saved_to_notion",
      entity_type: "content_generation",
      entity_id: generation_id,
      metadata: { posts_count: post_indices.length }
    });

    return new Response(JSON.stringify({ saved: post_indices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
