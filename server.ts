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

  // Supabase client for backend operations
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // --- API Routes (Simulating Edge Functions) ---

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
