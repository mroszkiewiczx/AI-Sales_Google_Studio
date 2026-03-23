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
    const { workspace_id, query } = body;
    
    if (!workspace_id || !query) {
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

    // 1. Search Supabase
    const { data: accounts } = await adminClient
      .from("accounts")
      .select("*")
      .eq("workspace_id", workspace_id)
      .ilike("name", `%${query}%`)
      .limit(1);

    const { data: contacts } = await adminClient
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspace_id)
      .ilike("name", `%${query}%`)
      .limit(5);

    let crm_data = { accounts, contacts };

    // 2. Check for SerpApi key
    const { data: cred } = await adminClient
      .from("integration_credentials")
      .select("api_key")
      .eq("workspace_id", workspace_id)
      .eq("provider", "serpapi")
      .eq("status", "active")
      .single();

    let web_summary = "Brak klucza SerpApi w ustawieniach integracji. Dodaj go, aby włączyć wyszukiwanie w sieci.";
    let news: string[] = [];
    let key_facts: string[] = [];
    let risks: string[] = [];
    let sources: string[] = [];

    if (cred?.api_key) {
      const serpQuery = encodeURIComponent(`${query} company Poland revenue employees`);
      const serpUrl = `https://serpapi.com/search.json?q=${serpQuery}&api_key=${cred.api_key}`;
      
      try {
        const serpRes = await fetch(serpUrl);
        if (serpRes.ok) {
          const serpData = await serpRes.json();
          web_summary = serpData.knowledge_graph?.description || "Znaleziono informacje w sieci.";
          if (serpData.organic_results) {
            sources = serpData.organic_results.slice(0, 3).map((r: any) => r.link);
            key_facts = serpData.organic_results.slice(0, 2).map((r: any) => r.snippet);
          }
        }
      } catch (e) {
        console.error("SerpApi error:", e);
      }
    }

    // 3. Check for Rejestr.io key
    const { data: rejestrCred } = await adminClient
      .from("integration_credentials")
      .select("api_key")
      .eq("workspace_id", workspace_id)
      .eq("provider", "rejestrio")
      .eq("status", "active")
      .single();

    let company_info = { name: query, nip: "", krs: "", address: "", employees: "", revenue_estimate: "" };

    if (rejestrCred?.api_key) {
      // Rejestr.io API expects NIP or KRS for exact search, but we can try to search by name
      // For simplicity, if query is a number (NIP/KRS), we search by it. Otherwise, we do a text search.
      const isNumber = /^\d+$/.test(query.replace(/\s|-/g, ''));
      const searchParam = isNumber ? `nip=${query.replace(/\s|-/g, '')}` : `name=${encodeURIComponent(query)}`;
      const rejestrUrl = `https://rejestr.io/api/v1/krs?${searchParam}`;
      
      try {
        const rejestrRes = await fetch(rejestrUrl, {
          headers: { "Authorization": rejestrCred.api_key }
        });
        if (rejestrRes.ok) {
          const rejestrData = await rejestrRes.json();
          if (rejestrData.items && rejestrData.items.length > 0) {
            const company = rejestrData.items[0];
            company_info = {
              name: company.name || query,
              nip: company.nip || "",
              krs: company.krs || "",
              address: company.address?.street ? `${company.address.street}, ${company.address.city}` : "",
              employees: "Brak danych w KRS",
              revenue_estimate: "Brak danych w KRS"
            };
            sources.push(`https://rejestr.io/krs/${company.krs}`);
          }
        }
      } catch (e) {
        console.error("Rejestr.io error:", e);
      }
    }

    return new Response(JSON.stringify({
      company_info,
      crm_data,
      web_summary,
      news,
      key_facts,
      risks,
      sources
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
