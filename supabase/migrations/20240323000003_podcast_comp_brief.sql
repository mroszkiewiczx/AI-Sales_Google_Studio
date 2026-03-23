-- supabase/migrations/20240323000003_podcast_comp_brief.sql

-- Podcast Episodes
CREATE TABLE IF NOT EXISTS public.podcast_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  style TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  segments_count INT NOT NULL DEFAULT 5,
  host_name TEXT,
  guest_name TEXT,
  segments JSONB NOT NULL DEFAULT '[]',
  full_script TEXT,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "podcast_workspace_isolation" ON public.podcast_episodes
  FOR ALL USING (is_workspace_member(workspace_id));

-- Competition Tracking
CREATE TABLE IF NOT EXISTS public.competition_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  industry TEXT,
  monitoring_frequency TEXT NOT NULL DEFAULT 'weekly',
  monitor_articles BOOLEAN NOT NULL DEFAULT true,
  monitor_social BOOLEAN NOT NULL DEFAULT true,
  monitor_pricing BOOLEAN NOT NULL DEFAULT true,
  monitor_jobs BOOLEAN NOT NULL DEFAULT false,
  last_analyzed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competition_tracking_workspace_isolation" ON public.competition_tracking
  FOR ALL USING (is_workspace_member(workspace_id));

-- Competitor Results
CREATE TABLE IF NOT EXISTS public.competitor_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  competitor_id uuid NOT NULL REFERENCES public.competition_tracking(id) ON DELETE CASCADE,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT,
  articles JSONB NOT NULL DEFAULT '[]',
  pricing_changes JSONB NOT NULL DEFAULT '[]',
  social_activity JSONB NOT NULL DEFAULT '[]',
  job_postings JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competitor_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitor_results_workspace_isolation" ON public.competitor_results
  FOR ALL USING (is_workspace_member(workspace_id));

-- Triggers for updated_at
CREATE TRIGGER update_podcast_episodes_updated_at
  BEFORE UPDATE ON public.podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competition_tracking_updated_at
  BEFORE UPDATE ON public.competition_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
