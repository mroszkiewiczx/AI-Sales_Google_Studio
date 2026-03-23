import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "mroszkiewicz@optimakers.pl";
    const password = "21Browar2121#@";

    // 1. Create or get user
    let userId: string;
    const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers();
    
    let existingUser = usersData?.users?.find(u => u.email === email);
    
    if (existingUser) {
      userId = existingUser.id;
      // Update password just in case
      await admin.auth.admin.updateUserById(userId, { password });
    } else {
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: "Mateusz Roszkiewicz" }
      });
      if (createErr) throw createErr;
      userId = newUser.user.id;
    }

    // 2. Ensure profile exists
    await admin.from("profiles").upsert({
      id: userId,
      display_name: "Mateusz Roszkiewicz",
      email: email
    });

    // 3. Create a workspace if none exists
    const { data: workspaces } = await admin.from("workspace_memberships").select("workspace_id").eq("user_id", userId);
    
    let workspaceId: string;
    if (!workspaces || workspaces.length === 0) {
      const { data: newWs, error: wsErr } = await admin.from("workspaces").insert({
        name: "Optimakers",
        slug: "optimakers",
        created_by: userId
      }).select("id").single();
      
      if (wsErr) {
        // Maybe slug already exists?
        const { data: existingWs } = await admin.from("workspaces").select("id").eq("slug", "optimakers").single();
        if (existingWs) {
          workspaceId = existingWs.id;
        } else {
          throw wsErr;
        }
      } else {
        workspaceId = newWs.id;
      }

      // Get admin role id
      const { data: roleData } = await admin.from("roles").select("id").eq("name", "admin").single();
      const roleId = roleData?.id;

      if (roleId) {
        await admin.from("workspace_memberships").insert({
          workspace_id: workspaceId,
          user_id: userId,
          role_id: roleId
        });
      }
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("Setup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
