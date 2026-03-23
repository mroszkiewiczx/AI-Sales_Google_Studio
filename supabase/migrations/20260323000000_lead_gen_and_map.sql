-- Lead Generation Results
CREATE TABLE IF NOT EXISTS public.lead_gen_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  search_config JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '[]',
  results_count INT NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_gen_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_lead_gen_results" ON public.lead_gen_results
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Lead Search Configs
CREATE TABLE IF NOT EXISTS public.lead_search_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_search_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_lead_search_configs" ON public.lead_search_configs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Update Accounts for Mapping
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3,1);

-- Integration Credentials (if not exists)
CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'google_maps', 'hubspot', etc.
  credentials JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, type)
);

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_integration_credentials" ON public.integration_credentials
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid()
    )
  );
