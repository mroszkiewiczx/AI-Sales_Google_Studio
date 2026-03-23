import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nip, krs } = await req.json();

    if (!nip && !krs) {
      throw new Error("NIP or KRS is required");
    }

    let result = null;

    if (nip) {
      // MF Biała Lista API
      const today = new Date().toISOString().split('T')[0];
      const url = `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${today}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.result?.subject) {
        const s = data.result.subject;
        result = {
          name: s.name,
          nip: s.nip,
          regon: s.regon,
          krs: s.krs,
          address: s.workingAddress || s.residenceAddress,
          status: s.statusVat,
        };
      }
    }

    if (!result && krs) {
      // KRS MS Gov API
      const url = `https://api-krs.ms.gov.pl/api/krs/OdpisAktualny/${krs}?rejestr=P&format=json`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.odpis?.dane?.dzial1?.danePodmiotu) {
        const p = data.odpis.dane.dzial1.danePodmiotu;
        const a = data.odpis.dane.dzial1.siedzibaIAdres.adres;
        result = {
          name: p.nazwa,
          nip: p.identyfikatory.nip,
          regon: p.identyfikatory.regon,
          krs: krs,
          address: `${a.ulica} ${a.nrDomu}${a.nrLokalu ? '/' + a.nrLokalu : ''}, ${a.kodPocztowy} ${a.miejscowosc}`,
        };
      }
    }

    if (!result) {
      throw new Error("Company not found");
    }

    return new Response(JSON.stringify(result), {
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
