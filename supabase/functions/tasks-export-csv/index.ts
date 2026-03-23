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
    const { workspace_id, status, task_type, priority, owner_id, source, account_id, contact_id, due_from, due_to, date_mode, show_completed, client_search, contact_search } = body;
    
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "workspace_id required" }), {
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

    let query = adminClient
      .from("tasks")
      .select(`
        *,
        owner:profiles!tasks_owner_id_fkey(display_name),
        account:accounts(name),
        contact:contacts(name, email)
      `)
      .eq("workspace_id", workspace_id)
      .is("deleted_at", null);

    if (status && status.length > 0) query = query.in("status", status);
    if (!show_completed && (!status || status.length === 0)) query = query.neq("status", "COMPLETED");
    if (task_type && task_type.length > 0) query = query.in("task_type", task_type);
    if (priority && priority.length > 0) query = query.in("priority", priority);
    if (owner_id) query = query.eq("owner_id", owner_id);
    if (source) query = query.eq("source", source);
    if (account_id) query = query.eq("account_id", account_id);
    if (contact_id) query = query.eq("contact_id", contact_id);

    if (due_from) {
      if (date_mode === 'done') query = query.gte("completed_at", due_from);
      else query = query.gte("due_date", due_from);
    }
    if (due_to) {
      if (date_mode === 'done') query = query.lte("completed_at", due_to);
      else query = query.lte("due_date", due_to);
    }

    if (client_search) query = query.ilike('account.name', `%${client_search}%`);
    if (contact_search) query = query.ilike('contact.name', `%${contact_search}%`);

    const { data: tasks, error } = await query;

    if (error) throw error;

    const filteredTasks = tasks.filter(t => 
      (!client_search || t.account) && 
      (!contact_search || t.contact)
    );

    const headers = ["id", "title", "task_type", "status", "priority", "due_date", "due_time", "notes", "account_name", "contact_name", "owner_name", "created_at", "completed_at", "source", "hubspot_task_id"];
    
    const csvRows = [headers.join(",")];
    for (const t of filteredTasks) {
      const row = [
        t.id,
        `"${(t.title || "").replace(/"/g, '""')}"`,
        t.task_type,
        t.status,
        t.priority,
        t.due_date || "",
        t.due_time || "",
        `"${(t.notes || "").replace(/"/g, '""')}"`,
        `"${(t.account?.name || "").replace(/"/g, '""')}"`,
        `"${(t.contact?.name || "").replace(/"/g, '""')}"`,
        `"${(t.owner?.display_name || "").replace(/"/g, '""')}"`,
        t.created_at,
        t.completed_at || "",
        t.source,
        t.hubspot_task_id || ""
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    return new Response(csvContent, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tasks.csv"'
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
