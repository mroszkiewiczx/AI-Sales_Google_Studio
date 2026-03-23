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

    const { summary_id } = await req.json();

    if (!summary_id) {
      throw new Error("summary_id is required");
    }

    // Fetch summary data
    const { data: summary, error: summaryError } = await supabaseClient
      .from("offer_summaries")
      .select(`
        *,
        hardware_calculations(*),
        license_calculations(*),
        implementation_calculations(*),
        dev_calculations(*),
        roi_calculations(*)
      `)
      .eq("id", summary_id)
      .single();

    if (summaryError || !summary) {
      throw new Error("Summary not found");
    }

    // Get HubSpot token from secrets
    const hsToken = Deno.env.get("HUBSPOT_TOKEN");
    if (!hsToken) {
      throw new Error("HubSpot integration not configured (HUBSPOT_TOKEN missing)");
    }

    // Get HubSpot Owner ID from profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("hubspot_owner_id")
      .eq("id", user.id)
      .single();

    const hubspotOwnerId = profile?.hubspot_owner_id;

    // 1. Find/Create Company in HubSpot
    let companyId = null;
    if (summary.client_nip) {
      const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/companies/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hsToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: "nip", operator: "EQ", value: summary.client_nip }] }],
        }),
      });
      const searchData = await searchRes.json();
      if (searchData.results?.length > 0) {
        companyId = searchData.results[0].id;
      } else {
        const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/companies", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hsToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              name: summary.client_name,
              nip: summary.client_nip,
              address: summary.client_address,
            },
          }),
        });
        const createData = await createRes.json();
        companyId = createData.id;
      }
    }

    // 2. Create Deal
    const dealRes = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hsToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          dealname: `Oferta: ${summary.client_name} - ${new Date().toLocaleDateString()}`,
          dealstage: "proposal",
          pipeline: "default",
          hubspot_owner_id: hubspotOwnerId,
          amount: summary.total_net || 0,
        },
      }),
    });
    const dealData = await dealRes.json();
    const dealId = dealData.id;

    // 3. Associate Company with Deal
    if (companyId && dealId) {
      await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/company/${companyId}/deal_to_company`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${hsToken}`,
        },
      });
    }

    // 4. Create Line Items (simplified)
    // In a real app, you'd iterate through all calculator items and create HubSpot products/line items
    // For now, we'll create a single line item for the total amount
    await fetch("https://api.hubapi.com/crm/v3/objects/line_items", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hsToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          name: "Podsumowanie Oferty",
          quantity: 1,
          price: summary.total_net || 0,
        },
        associations: [
          {
            to: { id: dealId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 20 }],
          },
        ],
      }),
    });

    // Update Supabase
    await supabaseClient
      .from("offer_summaries")
      .update({
        hubspot_deal_id: dealId,
        hubspot_synced_at: new Date().toISOString(),
        status: "generated",
      })
      .eq("id", summary_id);

    return new Response(JSON.stringify({ dealId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
