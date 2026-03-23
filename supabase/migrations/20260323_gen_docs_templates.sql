-- supabase/migrations/20260323_gen_docs_templates.sql

-- Table for AI Generated Documents
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('pptx','docx','pdf','xlsx','html','email','oferta')),
  prompt TEXT NOT NULL,
  tone TEXT,
  model_used TEXT,
  source_files JSONB NOT NULL DEFAULT '[]',
  -- [{ file_url, file_name, file_type }]
  pages_content JSONB NOT NULL DEFAULT '[]',
  -- [{ page_num, content_md }]
  output_url TEXT,
  tokens_used INT,
  cost_usd NUMERIC(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own documents" ON public.generated_documents
  FOR ALL USING (
    created_by = auth.uid() AND 
    workspace_id IN (SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid())
  );

CREATE INDEX ON public.generated_documents(workspace_id, created_by, created_at DESC);

-- Table for Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  category TEXT NOT NULL CHECK (category IN ('email','sms','followup','offer','other')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  -- variables: [{ key: "imię", description: "Imię klienta" }]
  use_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members" ON public.templates
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid())
  );

CREATE INDEX ON public.templates(workspace_id, category, is_active);

-- RPC for atomic increment
CREATE OR REPLACE FUNCTION public.increment_template_use(p_template_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.templates SET use_count = use_count + 1 WHERE id = p_template_id;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Templates (30 items)
-- Note: In a real migration, we'd need a workspace_id. 
-- For this session, we'll provide a way to seed them or assume they are added via UI/Script.
-- Below is a sample of how to seed for a specific workspace if needed.
