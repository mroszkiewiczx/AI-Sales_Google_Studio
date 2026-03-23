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
    const { workspace_id, status, task_type, priority, owner_id, source, account_id, contact_id, due_from, due_to, date_mode, show_completed, sort, sort_dir, client_search, contact_search, page } = body;
    
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
      `, { count: 'exact' })
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

    // Note: client_search and contact_search would typically require a separate RPC or a view 
    // because PostgREST doesn't support filtering by joined table columns easily without inner joins.
    // For simplicity, we'll fetch and filter in memory if searches are provided, or use inner joins if possible.
    // Assuming we can use foreign table filtering:
    if (client_search) query = query.ilike('account.name', `%${client_search}%`);
    if (contact_search) query = query.ilike('contact.name', `%${contact_search}%`);

    const sortCol = sort === 'date' ? 'due_date' : sort === 'title' ? 'title' : sort === 'priority' ? 'priority' : 'created_at';
    const isAsc = sort_dir === 'asc';
    query = query.order(sortCol, { ascending: isAsc });

    const limit = 20;
    const pageNum = page || 1;
    const from = (pageNum - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: tasks, error, count } = await query;

    if (error) throw error;

    // Filter out rows where inner join failed (if using foreign table filtering)
    const filteredTasks = tasks.filter(t => 
      (!client_search || t.account) && 
      (!contact_search || t.contact)
    );

    return new Response(JSON.stringify({ tasks: filteredTasks, total: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
