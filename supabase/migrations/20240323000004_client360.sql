-- supabase/migrations/20240323000004_client360.sql

-- accounts i contacts prawdopodobnie już istnieją (tworzone przez ai-sales-info)
-- Jeśli nie istnieją, utwórz:
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  industry TEXT,
  city TEXT,
  nip TEXT,
  website TEXT,
  domain TEXT,
  employees_count INT,
  logo_letter CHAR(1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_member" ON public.accounts
  FOR ALL USING (is_workspace_member(workspace_id));

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  position TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_member" ON public.contacts
  FOR ALL USING (is_workspace_member(workspace_id));

-- Nowa tabela: scoring history
CREATE TABLE IF NOT EXISTS public.client360_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  win_probability INT NOT NULL CHECK (win_probability BETWEEN 0 AND 100),
  label TEXT NOT NULL,                     -- "Gorący", "Obiecujący", "Zimny"
  description TEXT,
  actions JSONB DEFAULT '[]',              -- string[]
  risks JSONB DEFAULT '[]',                -- string[]
  model_used TEXT,
  prompt_tokens INT,
  completion_tokens INT,
  cost_usd NUMERIC(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client360_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "c360_scores_member" ON public.client360_scores
  FOR ALL USING (is_workspace_member(workspace_id));

-- Trigger for updated_at on accounts
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on contacts
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
