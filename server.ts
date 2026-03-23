import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Simple CORS middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-client-info, x-user-id, apikey");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Supabase client for backend operations
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // API routes (Simulating Edge Functions)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // company-lookup
  app.post("/functions/v1/company-lookup", async (req, res) => {
    try {
      const { nip, krs } = req.body;
      console.log("Lookup request:", { nip, krs });
      
      // Always return a result for demo purposes if any identifier is provided
      if (nip || krs) {
        return res.json({
          name: nip ? `Firma NIP ${nip}` : `Firma KRS ${krs}`,
          nip: nip || "1234567890",
          krs: krs || "0000123456",
          regon: "123456789",
          address: "ul. Przykładowa 123, 00-001 Warszawa",
          city: "Warszawa",
          industry: "Technologie",
          website: "https://example.com"
        });
      }
      
      res.status(400).json({ error: "NIP or KRS is required" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // tasks-list
  app.post("/functions/v1/tasks-list", async (req, res) => {
    try {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // tasks-save
  app.post("/functions/v1/tasks-save", async (req, res) => {
    try {
      const { task } = req.body;
      const { data, error } = await supabase.from("tasks").upsert(task).select().single();
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // get-analytics
  app.post("/functions/v1/get-analytics", async (req, res) => {
    try {
      res.json({
        revenue: 1250000,
        conversion: 12.5,
        avg_close_days: 45,
        open_deals: 24,
        pipeline_value: 3500000,
        lead_sources: [
          { source: "LinkedIn", count: 45, conversion: 15 },
          { source: "Strona www", count: 30, conversion: 10 },
          { source: "Polecenia", count: 15, conversion: 25 }
        ]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ai-ceo-chat
  app.post("/functions/v1/ai-ceo-chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      res.json({ 
        text: `To jest symulowana odpowiedź AI CEO na Twoje pytanie: "${message}". W kontekście: ${JSON.stringify(context || {})}.` 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // lead-intel-search
  app.post("/functions/v1/lead-intel-search", async (req, res) => {
    try {
      const { query } = req.body;
      res.json({
        summary: `Podsumowanie wywiadu dla: ${query}. Firma wydaje się stabilna, ostatnio ogłosili nową rundę finansowania.`,
        company_data: { name: query, employees: "50-100", revenue: "5-10M PLN" },
        key_facts: ["Nowa siedziba w Krakowie", "Wzrost zatrudnienia o 20%", "Partnerstwo z Google"],
        risks: ["Duża konkurencja na rynku lokalnym"],
        sources: ["LinkedIn", "KRS", "Strona www"]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // client360-get
  app.post("/functions/v1/client360-get", async (req, res) => {
    try {
      const { accountId } = req.body;
      res.json({
        account: { id: accountId, name: "Klient Testowy", city: "Wrocław", industry: "Produkcja" },
        contact: { first_name: "Jan", last_name: "Kowalski", email: "jan@example.com", phone: "+48 123 456 789" },
        calls: [{ id: "1", title: "Rozmowa o OptiMES", summary: "Klient zainteresowany modułem produkcyjnym.", created_at: new Date().toISOString() }],
        emails: [{ id: "1", subject: "Oferta", snippet: "Przesyłam wstępną ofertę...", created_at: new Date().toISOString() }],
        tasks: [{ id: "1", title: "Wysłać ofertę", status: "pending", created_at: new Date().toISOString() }],
        analyses: [{ id: "1", title: "Analiza potrzeb", content: "Klient potrzebuje integracji z ERP.", created_at: new Date().toISOString() }],
        deals: [{ id: "1", title: "Wdrożenie OptiMES", amount: 50000, stage: "proposal", probability: 60, created_at: new Date().toISOString() }],
        last_score: { win_probability: 65, label: "Wysoka szansa", actions: ["Umówić demo", "Wysłać case study"], risks: ["Długa decyzyjność"] }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // client360-score
  app.post("/functions/v1/client360-score", async (req, res) => {
    try {
      res.json({
        win_probability: 72,
        label: "Bardzo wysoka szansa",
        actions: ["Finalizacja umowy", "Przygotowanie planu wdrożenia"],
        risks: ["Brak budżetu na dodatkowe moduły"]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // transcript-clean
  app.post("/functions/v1/transcript-clean", async (req, res) => {
    try {
      const { content } = req.body;
      res.json({ cleaned: content.replace(/yyy|eee|hmmm/g, "").trim() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // lead-gen-search
  app.post("/functions/v1/lead-gen-search", async (req, res) => {
    try {
      const { workspace_id, region, industry, min_rating, min_reviews, has_website, max_results, keyword } = req.body;
      if (!workspace_id) return res.status(400).json({ error: "workspace_id required" });

      console.log("Lead Gen Search:", { region, industry, min_rating, min_reviews, has_website, max_results, keyword });

      // Mock results for demo
      const mockResults = Array.from({ length: max_results || 10 }).map((_, i) => ({
        place_id: `place_${i}`,
        name: `${industry || "Firma"} ${i + 1} ${region || ""}`,
        address: `ul. Biznesowa ${i + 1}, ${region || "Warszawa"}`,
        rating: 3.5 + Math.random() * 1.5,
        reviews_count: Math.floor(Math.random() * 500) + 10,
        phone: `+48 ${Math.floor(Math.random() * 900000000) + 100000000}`,
        website: has_website ? `https://firma${i + 1}.pl` : undefined,
        lat: 52.2297 + (Math.random() - 0.5) * 0.1,
        lng: 21.0122 + (Math.random() - 0.5) * 0.1,
        types: [industry?.toLowerCase() || "business"]
      }));

      const { data, error } = await supabase
        .from("lead_gen_results")
        .insert({
          workspace_id,
          search_config: { region, industry, min_rating, min_reviews, has_website, max_results, keyword },
          results: mockResults,
          results_count: mockResults.length
        })
        .select("id")
        .single();

      if (error) throw error;

      res.json({ search_id: data.id, results: mockResults, results_count: mockResults.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // lead-gen-export
  app.post("/functions/v1/lead-gen-export", async (req, res) => {
    try {
      const { workspace_id, search_id, indices } = req.body;
      if (!workspace_id || !search_id) return res.status(400).json({ error: "workspace_id and search_id required" });

      const { data, error } = await supabase
        .from("lead_gen_results")
        .select("results")
        .eq("id", search_id)
        .single();

      if (error) throw error;

      let results = data.results;
      if (indices && indices.length > 0) {
        results = results.filter((_: any, i: number) => indices.includes(i));
      }

      const csvRows = [
        ["Nazwa", "Adres", "Branża", "Ocena", "Recenzje", "Strona www", "Telefon"],
        ...results.map((r: any) => [
          r.name,
          r.address,
          r.types?.join(", ") || "",
          r.rating,
          r.reviews_count,
          r.website || "",
          r.phone || ""
        ])
      ];

      const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=leady-${new Date().toISOString().slice(0, 10)}.csv`);
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // maps-key
  app.post("/functions/v1/maps-key", async (req, res) => {
    try {
      const { workspace_id } = req.body;
      if (!workspace_id) return res.status(400).json({ error: "workspace_id required" });

      const { data, error } = await supabase
        .from("integration_credentials")
        .select("credentials")
        .eq("workspace_id", workspace_id)
        .eq("type", "google_maps")
        .single();

      if (error) {
        // Return a mock key for demo if not found in DB
        return res.json({ key: "MOCK_GOOGLE_MAPS_KEY" });
      }

      res.json({ key: data.credentials.api_key });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // maps-data
  app.post("/functions/v1/maps-data", async (req, res) => {
    try {
      const { workspace_id } = req.body;
      if (!workspace_id) return res.status(400).json({ error: "workspace_id required" });

      // Fetch accounts with deals
      const { data: accounts, error: accError } = await supabase
        .from("accounts")
        .select(`
          id, name, address, lat, lng, google_rating,
          deals(status, amount)
        `)
        .eq("workspace_id", workspace_id);

      if (accError) throw accError;

      // Fetch recent lead results
      const { data: leadResults, error: leadError } = await supabase
        .from("lead_gen_results")
        .select("results")
        .eq("workspace_id", workspace_id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (leadError) throw leadError;

      const clients = (accounts || []).map(a => ({
        id: a.id,
        name: a.name,
        address: a.address,
        lat: a.lat || 52.2297 + (Math.random() - 0.5) * 0.5,
        lng: a.lng || 21.0122 + (Math.random() - 0.5) * 0.5,
        deal_status: a.deals?.[0]?.status,
        deal_value: a.deals?.[0]?.amount,
        google_rating: a.google_rating
      }));

      const leads = (leadResults || []).flatMap(lr => lr.results);

      res.json({ clients, leads });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // geocode-address
  app.post("/functions/v1/geocode-address", async (req, res) => {
    try {
      const { workspace_id, account_id, address } = req.body;
      if (!workspace_id || !account_id || !address) return res.status(400).json({ error: "Missing parameters" });

      // Mock geocoding
      const lat = 52.2297 + (Math.random() - 0.5) * 0.1;
      const lng = 21.0122 + (Math.random() - 0.5) * 0.1;

      const { error } = await supabase
        .from("accounts")
        .update({ lat, lng })
        .eq("id", account_id);

      if (error) throw error;

      res.json({ lat, lng });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // hubspot-create-deal
  app.post("/functions/v1/hubspot-create-deal", async (req, res) => {
    try {
      const { summary_id } = req.body;
      console.log("HubSpot Create Deal for summary:", summary_id);
      
      const hubspot_deal_id = `hs_deal_${Math.floor(Math.random() * 1000000)}`;
      
      const { error } = await supabase
        .from("offer_summaries")
        .update({ hubspot_deal_id, hubspot_synced_at: new Date().toISOString() })
        .eq("id", summary_id);
        
      if (error) throw error;
      
      res.json({ success: true, hubspot_deal_id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // offer-export-pdf
  app.post("/functions/v1/offer-export-pdf", async (req, res) => {
    try {
      const { summary_id } = req.body;
      console.log("Export PDF for summary:", summary_id);
      
      const pdf_url = `https://example.com/offers/${summary_id}.pdf`;
      
      const { error } = await supabase
        .from("offer_summaries")
        .update({ pdf_url, status: 'generated' })
        .eq("id", summary_id);
        
      if (error) throw error;
      
      res.json({ success: true, pdf_url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // gen-docs-generate
  app.post("/functions/v1/gen-docs-generate", async (req, res) => {
    try {
      const { workspace_id, doc_type, prompt, tone, model, source_file_urls, use_brand } = req.body;
      if (!workspace_id) return res.status(400).json({ error: "workspace_id required" });

      console.log("Gen Docs Generate:", { doc_type, prompt, tone, model, source_file_urls, use_brand });

      // Mock AI generation for demo
      const mockContent = `
# ${doc_type.toUpperCase()} - ${tone.toUpperCase()}
Wygenerowano na podstawie: ${prompt}

---STRONA---

## Strona 2: Analiza
To jest treść wygenerowana przez model ${model || "google/gemini-2.5-flash"}.
Użyto plików źródłowych: ${source_file_urls?.length || 0}.
${use_brand ? "Zastosowano branding firmowy." : ""}

---STRONA---

## Strona 3: Podsumowanie
Dziękujemy za skorzystanie z Generatora Dokumentów SalesOS.
      `.trim();

      const pages = mockContent.split("---STRONA---").map((content, i) => ({
        page_num: i + 1,
        content_md: content.trim()
      }));

      const { data, error } = await supabase
        .from("generated_documents")
        .insert({
          workspace_id,
          created_by: req.headers["x-user-id"] || "00000000-0000-0000-0000-000000000000",
          doc_type,
          prompt,
          tone,
          model_used: model || "google/gemini-2.5-flash",
          source_files: source_file_urls?.map((url: string) => ({ file_url: url, file_name: "source.pdf", file_type: "pdf" })) || [],
          pages_content: pages,
          tokens_used: 1250,
          cost_usd: 0.00125
        })
        .select("id")
        .single();

      if (error) throw error;

      res.json({ document_id: data.id, pages_content: pages, tokens_used: 1250, cost_usd: 0.00125 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // gen-docs-export
  app.post("/functions/v1/gen-docs-export", async (req, res) => {
    try {
      const { workspace_id, document_id, format } = req.body;
      if (!workspace_id || !document_id) return res.status(400).json({ error: "workspace_id and document_id required" });

      console.log("Gen Docs Export:", { document_id, format });

      const download_url = `https://example.com/exports/${document_id}.${format}`;
      
      const { error } = await supabase
        .from("generated_documents")
        .update({ output_url: download_url })
        .eq("id", document_id);

      if (error) throw error;

      res.json({ download_url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // template-personalize
  app.post("/functions/v1/template-personalize", async (req, res) => {
    try {
      const { workspace_id, template_id, account_id, custom_vars } = req.body;
      if (!workspace_id || !template_id) return res.status(400).json({ error: "workspace_id and template_id required" });

      const { data: template, error: tError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (tError) throw tError;

      let personalized_body = template.body;
      const used_vars: Record<string, string> = { ...custom_vars };

      if (account_id) {
        const { data: account, error: aError } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", account_id)
          .single();
        
        if (!aError && account) {
          used_vars["firma"] = account.name;
          used_vars["imię"] = account.contact_name || "Szanowny Kliencie";
          used_vars["branża"] = account.industry || "Twoja branża";
        }
      }

      // Replace variables in body
      Object.entries(used_vars).forEach(([key, val]) => {
        personalized_body = personalized_body.replace(new RegExp(`{${key}}`, "g"), val);
      });

      // Mock AI for remaining variables
      const remainingVars = personalized_body.match(/{[^}]+}/g) || [];
      remainingVars.forEach(v => {
        const key = v.replace(/{|}/g, "");
        const mockVal = `[AI: ${key}]`;
        personalized_body = personalized_body.replace(v, mockVal);
        used_vars[key] = mockVal;
      });

      res.json({ personalized_body, used_vars });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generic fallback for other functions
  app.post("/functions/v1/:name", (req, res) => {
    console.log(`Function called: ${req.params.name}`, req.body);
    res.json({ success: true, message: `Function ${req.params.name} executed (mock)` });
  });

  // implementation-calculate
  app.post("/functions/v1/implementation-calculate", async (req, res) => {
    try {
      const { workspace_id, line_items, save, deal_id } = req.body;
      
      if (!workspace_id) return res.status(400).json({ error: "workspace_id is required" });

      let suma_jdn = 0;
      let suma_mies = 0;
      let suma_rocz = 0;

      const line_items_with_subtotals = line_items.map((item: any) => {
        const subtotal = (item.cena || 0) * (item.ilosc || 0);
        if (["Jednorazowo", "Ratalna", "Leasing"].includes(item.model)) {
          suma_jdn += subtotal;
        } else if (item.model === "Miesięcznie") {
          suma_mies += subtotal;
        } else if (item.model === "Rocznie") {
          suma_rocz += subtotal;
        }
        return { ...item, subtotal };
      });

      let calculation_id = null;
      if (save) {
        const { data, error } = await supabase
          .from("implementation_calculations")
          .insert({
            workspace_id,
            created_by: req.headers["x-user-id"] || "00000000-0000-0000-0000-000000000000", // Fallback for demo
            deal_id,
            line_items: line_items_with_subtotals,
            suma_jdn,
            suma_mies,
            suma_rocz
          })
          .select("id")
          .single();
        
        if (error) throw error;
        calculation_id = data.id;
      }

      res.json({
        line_items_with_subtotals,
        suma_jdn,
        suma_mies,
        suma_rocz,
        calculation_id
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // implementation-products-sync
  app.post("/functions/v1/implementation-products-sync", async (req, res) => {
    try {
      const { workspace_id } = req.body;
      if (!workspace_id) return res.status(400).json({ error: "workspace_id is required" });

      const seedProducts = [
        { hubspot_product_id: '377119501554', nazwa: 'Pakiet OptiMES', cena_bazowa: 9954, model: 'Rocznie', grupa: 'Pakiety' },
        { hubspot_product_id: 'HS_START_PLUS', nazwa: 'Start+', cena_bazowa: 24990, model: 'Jednorazowo', grupa: 'Bezpieczne' },
        { hubspot_product_id: 'HS_PRO', nazwa: 'Pro', cena_bazowa: 62475, model: 'Jednorazowo', grupa: 'Bezpieczne' },
        { hubspot_product_id: 'HS_PRO_MAX', nazwa: 'Pro MAX', cena_bazowa: 124950, model: 'Jednorazowo', grupa: 'Bezpieczne' },
        { hubspot_product_id: 'HS_ELASTYCZNY', nazwa: 'Elastyczny', cena_bazowa: 249.75, model: 'Miesięcznie', grupa: 'Opieka' },
        { hubspot_product_id: 'HS_START_PLUS_MIES', nazwa: 'Start+', cena_bazowa: 999, model: 'Miesięcznie', grupa: 'Opieka' },
        { hubspot_product_id: 'HS_ROZSZERZONY', nazwa: 'Rozszerzony', cena_bazowa: 2465, model: 'Miesięcznie', grupa: 'Opieka' },
        { hubspot_product_id: 'HS_PREMIUM', nazwa: 'Premium', cena_bazowa: 7395, model: 'Miesięcznie', grupa: 'Opieka' },
        { hubspot_product_id: 'HS_GODZ_DORADCZA', nazwa: 'Godzina doradcza', cena_bazowa: 249.75, model: 'Jednorazowo', grupa: 'Szkolenia', jednostka: 'h' },
        { hubspot_product_id: 'HS_DZIEN_DORADCZY', nazwa: 'Dzień doradczy', cena_bazowa: 1998, model: 'Jednorazowo', grupa: 'Szkolenia', jednostka: 'dzień' },
        { hubspot_product_id: 'HS_START_PRODUKCYJNY', nazwa: 'Start produkcyjny', cena_bazowa: 1998, model: 'Jednorazowo', grupa: 'Szkolenia' },
        { hubspot_product_id: 'HS_ANALIZA', nazwa: 'Analiza przedwdr.', cena_bazowa: 9990, model: 'Jednorazowo', grupa: 'Szkolenia' },
        { hubspot_product_id: 'HS_DOJAZD', nazwa: 'Dojazd (km)', cena_bazowa: 1.25, model: 'Jednorazowo', grupa: 'Zwroty', jednostka: 'km' },
        { hubspot_product_id: 'HS_NOCLEG', nazwa: 'Nocleg', cena_bazowa: 350, model: 'Jednorazowo', grupa: 'Zwroty', jednostka: 'noc' },
      ];

      const productsToInsert = seedProducts.map((p, idx) => ({
        ...p,
        workspace_id,
        sort_order: idx,
        is_active: true
      }));

      const { error } = await supabase
        .from("implementation_products")
        .upsert(productsToInsert, { onConflict: 'workspace_id,hubspot_product_id' });

      if (error) throw error;

      res.json({ success: true, count: seedProducts.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // dev-calculate
  app.post("/functions/v1/dev-calculate", async (req, res) => {
    try {
      const { workspace_id, line_items, save, deal_id } = req.body;
      if (!workspace_id) return res.status(400).json({ error: "workspace_id is required" });

      const total = line_items.reduce((sum: number, item: any) => sum + (Number(item.kwota) || 0), 0);

      let calculation_id = null;
      if (save) {
        const { data, error } = await supabase
          .from("dev_calculations")
          .insert({
            workspace_id,
            created_by: req.headers["x-user-id"] || "00000000-0000-0000-0000-000000000000",
            deal_id,
            line_items,
            total,
            hubspot_product_id: '261061910719'
          })
          .select("id")
          .single();
        
        if (error) throw error;
        calculation_id = data.id;
      }

      res.json({ total, calculation_id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
