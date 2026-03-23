-- supabase/migrations/20240323000002_hardware_offer_summary.sql

-- SPRZĘT
CREATE TABLE IF NOT EXISTS public.hardware_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  deal_id uuid REFERENCES public.deals(id),
  line_items JSONB DEFAULT '[]',  -- [{id, nazwa, opis, cena, ilosc, subtotal}]
  total NUMERIC(12,2) DEFAULT 0,
  is_snapshot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hardware_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hardware_calc_member" ON public.hardware_calculations
  FOR ALL USING (is_workspace_member(workspace_id));

-- PODSUMOWANIE OFERTY
CREATE TABLE IF NOT EXISTS public.offer_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  deal_id uuid REFERENCES public.deals(id),
  account_id uuid REFERENCES public.accounts(id),
  -- Dane klienta (z company-lookup)
  client_name TEXT,
  client_nip TEXT,
  client_krs TEXT,
  client_regon TEXT,
  client_address TEXT,
  client_contact_person TEXT,
  client_contact_date DATE,
  decision_makers JSONB DEFAULT '[]',  -- [{name, role, email, phone}]
  -- Snapshoty kalkulatorów (FK do ich tabel)
  license_calc_id uuid REFERENCES public.license_calculations(id),
  implementation_calc_id uuid REFERENCES public.implementation_calculations(id),
  dev_calc_id uuid REFERENCES public.dev_calculations(id),
  hardware_calc_id uuid REFERENCES public.hardware_calculations(id),
  roi_calc_id uuid REFERENCES public.roi_calculations(id),
  -- Harmonogram płatności
  payment_schedule JSONB DEFAULT '[]',  -- [{date, amount, description, paid}]
  -- HubSpot
  hubspot_deal_id TEXT,
  hubspot_synced_at TIMESTAMPTZ,
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','generated','sent')),
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_summaries_member" ON public.offer_summaries
  FOR ALL USING (is_workspace_member(workspace_id));

-- Trigger for updated_at
CREATE TRIGGER hardware_calculations_updated BEFORE UPDATE ON public.hardware_calculations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER offer_summaries_updated BEFORE UPDATE ON public.offer_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
