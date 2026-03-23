-- supabase/migrations/20240323000001_gen_content_newsletter.sql

-- ==========================================
-- MODUŁ: gen-content (Social Media)
-- ==========================================

-- Ustawienia AI per workspace
CREATE TABLE IF NOT EXISTS public.content_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  default_tone TEXT NOT NULL DEFAULT 'Profesjonalny',
  default_goal TEXT NOT NULL DEFAULT 'Edukacja',
  default_channels TEXT[] NOT NULL DEFAULT '{"LinkedIn Osobisty","LinkedIn Firmowy"}',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  language TEXT NOT NULL DEFAULT 'pl',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE public.content_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_settings_workspace_isolation" ON public.content_settings
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_content_settings_updated_at
  BEFORE UPDATE ON public.content_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Historia generowań contentu
CREATE TABLE IF NOT EXISTS public.content_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  base_content TEXT,
  tone TEXT NOT NULL,
  goal TEXT NOT NULL,
  channels TEXT[] NOT NULL,
  hashtags BOOLEAN NOT NULL DEFAULT false,
  posts JSONB NOT NULL DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_generations_workspace_isolation" ON public.content_generations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX ON public.content_generations(workspace_id, created_at DESC);

-- ==========================================
-- MODUŁ: gen-newsletter (Newsletter HTML)
-- ==========================================

-- Szablony newsletterów
CREATE TABLE IF NOT EXISTS public.newsletter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  h1 TEXT,
  content TEXT,
  cta_text TEXT,
  cta_url TEXT,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#6366f1',
  footer_text TEXT NOT NULL DEFAULT 'Wiadomość wygenerowana automatycznie',
  header_image_url TEXT,
  html_export TEXT,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_templates_workspace_isolation" ON public.newsletter_templates
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_newsletter_templates_updated_at
  BEFORE UPDATE ON public.newsletter_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ON public.newsletter_templates(workspace_id, created_at DESC);

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
-- Uwaga: Buckety tworzone są zazwyczaj przez UI lub skrypt admina.
-- Zakładamy istnienie bucketów: 'content-images', 'newsletter-images'
