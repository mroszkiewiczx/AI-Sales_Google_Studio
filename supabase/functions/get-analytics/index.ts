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
    const { workspace_id, period } = body; // period e.g. "2024-03" or "2024-Q1"
    
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

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Calculate dates based on period
    let monthStart, monthEnd, prevStart, prevEnd;
    const now = new Date();
    
    if (period && period.includes('-Q')) {
      const [year, q] = period.split('-Q');
      const startMonth = (parseInt(q) - 1) * 3;
      monthStart = new Date(parseInt(year), startMonth, 1).toISOString();
      monthEnd = new Date(parseInt(year), startMonth + 3, 1).toISOString();
      prevStart = new Date(parseInt(year), startMonth - 3, 1).toISOString();
      prevEnd = new Date(parseInt(year), startMonth, 1).toISOString();
    } else if (period) {
      const [year, month] = period.split('-');
      monthStart = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      monthEnd = new Date(parseInt(year), parseInt(month), 1).toISOString();
      prevStart = new Date(parseInt(year), parseInt(month) - 2, 1).toISOString();
      prevEnd = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    } else {
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }

    // Fetch all deals for the workspace
    const { data: allDeals } = await admin
      .from("deals")
      .select("*")
      .eq("workspace_id", workspace_id);

    const deals = allDeals || [];

    const closedWonInMonth = deals.filter(d => d.stage === "closed_won" && d.close_date >= monthStart.slice(0,10) && d.close_date < monthEnd.slice(0,10));
    const closedWonPrev = deals.filter(d => d.stage === "closed_won" && d.close_date >= prevStart.slice(0,10) && d.close_date < prevEnd.slice(0,10));

    const revenue = closedWonInMonth.reduce((sum, d) => sum + (d.amount || 0), 0);
    const prevRevenue = closedWonPrev.reduce((sum, d) => sum + (d.amount || 0), 0);
    const revenue_change = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;

    const leadsInMonth = deals.filter(d => d.created_at >= monthStart && d.created_at < monthEnd);
    const prevLeads = deals.filter(d => d.created_at >= prevStart && d.created_at < prevEnd);
    const new_leads_count = leadsInMonth.length;

    const conversion_rate = leadsInMonth.length ? (closedWonInMonth.length / leadsInMonth.length) * 100 : 0;
    const prev_conversion = prevLeads.length ? (closedWonPrev.length / prevLeads.length) * 100 : 0;
    const conversion_change = prev_conversion ? conversion_rate - prev_conversion : null;

    const avg_close_days = closedWonInMonth.length 
      ? closedWonInMonth.reduce((sum, d) => sum + (new Date(d.close_date!).getTime() - new Date(d.created_at).getTime()) / (1000 * 3600 * 24), 0) / closedWonInMonth.length
      : 0;
    const prev_avg_close = closedWonPrev.length
      ? closedWonPrev.reduce((sum, d) => sum + (new Date(d.close_date!).getTime() - new Date(d.created_at).getTime()) / (1000 * 3600 * 24), 0) / closedWonPrev.length
      : 0;
    const close_days_change = prev_avg_close ? ((avg_close_days - prev_avg_close) / prev_avg_close) * 100 : null;

    const openDeals = deals.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost");
    const open_deals_count = openDeals.length;
    const open_deals_value = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

    // 5. avg_bant_score
    const { data: bantScores } = await admin
      .from("org_analyses")
      .select("bant_total")
      .eq("workspace_id", workspace_id)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd)
      .not("bant_total", "is", null);
    const avg_bant_score = bantScores?.length
      ? bantScores.reduce((s, a) => s + (a.bant_total || 0), 0) / bantScores.length
      : null;

    // 6. transcripts_count
    const { count: transcripts_count } = await admin
      .from("transcripts")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspace_id)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd);

    // 7. tasks_completed_count
    const { count: tasks_completed_count } = await admin
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspace_id)
      .eq("status", "COMPLETED")
      .gte("completed_at", monthStart)
      .lt("completed_at", monthEnd);

    // 9. win_rate
    const closedLostInMonth = deals.filter(
      d => d.stage === "closed_lost" && d.close_date >= monthStart.slice(0,10) && d.close_date < monthEnd.slice(0,10)
    );
    const win_rate = (closedWonInMonth.length + closedLostInMonth.length) > 0
      ? closedWonInMonth.length / (closedWonInMonth.length + closedLostInMonth.length)
      : null;

    const kpi = {
      revenue, revenue_change,
      conversion_rate, conversion_change,
      avg_close_days, close_days_change,
      open_deals_count, open_deals_value,
      avg_bant_score, transcripts_count: transcripts_count || 0,
      tasks_completed_count: tasks_completed_count || 0,
      new_leads_count, win_rate
    };

    // Pipeline
    const pipeline = [
      { name: "Lead", value: openDeals.filter(d => d.stage === "lead").reduce((s, d) => s + (d.amount || 0), 0) },
      { name: "Qualified", value: openDeals.filter(d => d.stage === "qualified").reduce((s, d) => s + (d.amount || 0), 0) },
      { name: "Proposal", value: openDeals.filter(d => d.stage === "proposal").reduce((s, d) => s + (d.amount || 0), 0) },
      { name: "Negotiation", value: openDeals.filter(d => d.stage === "negotiation").reduce((s, d) => s + (d.amount || 0), 0) },
    ];

    // Lead Sources
    const sourcesMap: Record<string, { leads: number; closed_won: number; revenue: number }> = {};
    leadsInMonth.forEach(d => {
      const src = d.source || "unknown";
      if (!sourcesMap[src]) sourcesMap[src] = { leads: 0, closed_won: 0, revenue: 0 };
      sourcesMap[src].leads++;
      if (d.stage === "closed_won") {
        sourcesMap[src].closed_won++;
        sourcesMap[src].revenue += (d.amount || 0);
      }
    });
    const leadSources = Object.entries(sourcesMap).map(([source, data]) => ({
      source,
      leads: data.leads,
      conversion: (data.closed_won / data.leads) * 100,
      revenue: data.revenue
    })).sort((a, b) => b.revenue - a.revenue);

    // Salespeople Ranking
    const { data: profiles } = await admin.from("profiles").select("id, display_name");
    const rankingMap: Record<string, { name: string; closed_deals: number; revenue: number; commission: number }> = {};
    closedWonInMonth.forEach(d => {
      const owner = d.owner_id || "unassigned";
      if (!rankingMap[owner]) {
        const profile = profiles?.find(p => p.id === owner);
        rankingMap[owner] = { name: profile?.display_name || "Nieprzypisany", closed_deals: 0, revenue: 0, commission: 0 };
      }
      rankingMap[owner].closed_deals++;
      rankingMap[owner].revenue += (d.amount || 0);
      rankingMap[owner].commission += (d.amount || 0) * 0.1; // 10% commission mock
    });
    const ranking = Object.values(rankingMap).sort((a, b) => b.revenue - a.revenue);

    return new Response(JSON.stringify({ kpi, pipeline, leadSources, ranking }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
