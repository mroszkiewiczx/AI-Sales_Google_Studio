import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { workspace_id, line_items, save = false, deal_id } = await req.json();

    if (!workspace_id) {
      throw new Error("workspace_id is required");
    }

    // Authorization check
    const { data: isMember, error: memberError } = await supabaseClient.rpc(
      "is_workspace_member",
      { target_workspace_id: workspace_id }
    );

    if (memberError || !isMember) {
      throw new Error("Unauthorized: Not a workspace member");
    }

    // Calculate total
    let total = 0;
    const items = line_items.map((item: any) => {
      const subtotal = (item.cena || 0) * (item.ilosc || 0);
      total += subtotal;
      return { ...item, subtotal };
    });

    let savedData = null;
    if (save) {
      const { data, error } = await supabaseClient
        .from("hardware_calculations")
        .insert({
          workspace_id,
          created_by: user.id,
          deal_id,
          line_items: items,
          total,
        })
        .select()
        .single();

      if (error) throw error;
      savedData = data;
    }

    return new Response(
      JSON.stringify({
        total,
        line_items: items,
        savedData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
