import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function buildContext(
  adminClient: any,
  workspace_id: string,
  user_id: string,
  context_flags: {
    pipeline: boolean;
    tasks_today: boolean;
    transcripts: boolean;
    briefs: boolean;
    hubspot: boolean;
    notion: boolean;
    knowledge: boolean;
    emails: boolean;
  }
): Promise<string> {
  const parts: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (context_flags.pipeline) {
    const { data: deals } = await adminClient
      .from("deals")
      .select("title, stage, amount, close_date, accounts(name)")
      .eq("workspace_id", workspace_id)
      .not("stage", "in", '("closed_won","closed_lost")')
      .order("amount", { ascending: false })
      .limit(10);
    if (deals?.length) {
      parts.push(`## Pipeline (top 10 otwartych dealów)\n${deals.map((d: any) =>
        `- ${d.accounts?.name || "?"}: ${d.title} | ${d.stage} | ${d.amount} PLN | zamknięcie: ${d.close_date || "brak"}`
      ).join("\n")}`);
    }
  }

  if (context_flags.tasks_today) {
    const { data: tasks } = await adminClient
      .from("tasks")
      .select("title, task_type, status, due_time, accounts(name), contacts(name)")
      .eq("workspace_id", workspace_id)
      .eq("due_date", today)
      .neq("status", "COMPLETED")
      .order("due_time", { ascending: true });
    if (tasks?.length) {
      parts.push(`## Zadania na dziś (${today})\n${tasks.map((t: any) =>
        `- [${t.task_type}] ${t.title} | ${t.accounts?.name || ""} | ${t.due_time || ""} | ${t.status}`
      ).join("\n")}`);
    }
  }

  if (context_flags.transcripts) {
    const { data: transcripts } = await adminClient
      .from("transcripts")
      .select("title, created_at, bant_total, accounts(name)")
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false })
      .limit(3);
    if (transcripts?.length) {
      parts.push(`## Ostatnie transkrypcje\n${transcripts.map((t: any) =>
        `- ${t.accounts?.name || "?"}: ${t.title} | BANT: ${t.bant_total ?? "N/A"} | ${t.created_at.slice(0, 10)}`
      ).join("\n")}`);
    }
  }

  if (context_flags.briefs) {
    const { data: briefs } = await adminClient
      .from("meeting_briefs")
      .select("meeting_title, meeting_time, contact_name, bant_total")
      .eq("workspace_id", workspace_id)
      .gte("meeting_time", new Date().toISOString())
      .order("meeting_time", { ascending: true })
      .limit(3);
    if (briefs?.length) {
      parts.push(`## Najbliższe spotkania\n${briefs.map((b: any) =>
        `- ${b.meeting_time?.slice(0, 16)}: ${b.meeting_title} z ${b.contact_name || "?"}`
      ).join("\n")}`);
    }
  }

  if (context_flags.emails) {
    const { data: threads } = await adminClient
      .from("email_threads")
      .select("subject, last_message_at, accounts(name)")
      .eq("workspace_id", workspace_id)
      .order("last_message_at", { ascending: false })
      .limit(10);
    if (threads?.length) {
      parts.push(`## Ostatnie emaile\n${threads.map((t: any) =>
        `- ${t.accounts?.name || "?"}: "${t.subject}" | ${t.last_message_at?.slice(0, 10)}`
      ).join("\n")}`);
    }
  }

  if (context_flags.hubspot) {
    const { data: cred } = await adminClient
      .from("integration_credentials")
      .select("status")
      .eq("workspace_id", workspace_id)
      .eq("provider", "hubspot")
      .single();
    if (cred?.status === "active") {
      parts.push("## HubSpot CRM\nPołączony. Możesz pytać o dane kontaktów i firm z HubSpot.");
    }
  }

  return parts.length > 0
    ? `Kontekst workspace (${new Date().toISOString().slice(0, 10)}):\n\n${parts.join("\n\n")}`
    : "";
}

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
    const { workspace_id, messages, model, context_flags } = body;
    
    if (!workspace_id || !messages || !model) {
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

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const contextString = await buildContext(adminClient, workspace_id, user.id, context_flags || {});

    const systemPrompt = `Jesteś AI Sales CEO — strategiczny asystent sprzedażowy.
Masz dostęp do danych workspace i pomagasz handlowcom podejmować decyzje.
Odpowiadaj naturalnie, konkretnie, po polsku. Unikaj akademickiego stylu.
Gdy pytają o firmę/deal/kontakt — odwołuj się do konkretnych danych z kontekstu.

${contextString}`;

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterKey) {
      throw new Error("Missing OPENROUTER_API_KEY");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error: ${err}`);
    }

    const result = await response.json();
    const reply = result.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
