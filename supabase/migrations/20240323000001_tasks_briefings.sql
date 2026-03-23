-- supabase/migrations/20240323000001_tasks_briefings.sql

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  owner_id uuid REFERENCES public.profiles(id),
  account_id uuid REFERENCES public.accounts(id),
  contact_id uuid REFERENCES public.contacts(id),
  deal_id uuid REFERENCES public.deals(id),
  title TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'CALL','EMAIL','LINKED_IN','MEETING',
    'LINKED_IN_CONNECT','LINKED_IN_MESSAGE','TODO','MEETING_GCAL'
  )),
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN (
    'NOT_STARTED','IN_PROGRESS','COMPLETED','WAITING','DEFERRED'
  )),
  priority TEXT NOT NULL DEFAULT 'NONE' CHECK (priority IN ('HIGH','MEDIUM','LOW','NONE')),
  due_date DATE,
  due_time TIME,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'app' CHECK (source IN ('app','hubspot','gcal')),
  hubspot_task_id TEXT UNIQUE,
  hubspot_synced_at TIMESTAMPTZ,
  gcal_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_workspace" ON public.tasks
  FOR ALL USING (is_workspace_member(workspace_id));
CREATE INDEX IF NOT EXISTS tasks_workspace_due ON public.tasks(workspace_id, due_date, status);
CREATE INDEX IF NOT EXISTS tasks_account ON public.tasks(account_id);
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rejestracje rozmów
CREATE TABLE IF NOT EXISTS public.call_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  account_id uuid REFERENCES public.accounts(id),
  contact_id uuid REFERENCES public.contacts(id),
  deal_id uuid REFERENCES public.deals(id),
  task_id uuid REFERENCES public.tasks(id),
  called_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INT,
  outcome TEXT CHECK (outcome IN ('ANSWERED','NO_ANSWER','BUSY','LEFT_VOICEMAIL','WRONG_NUMBER','CONNECTED','LEFT_LIVE_MESSAGE')),
  direction TEXT CHECK (direction IN ('OUTBOUND','INBOUND')),
  phone_number TEXT,
  notes TEXT,
  hubspot_call_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.call_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_reg_workspace" ON public.call_registrations
  FOR ALL USING (is_workspace_member(workspace_id));

CREATE TABLE IF NOT EXISTS public.meeting_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  account_id uuid REFERENCES public.accounts(id),
  calendar_event_id TEXT,
  meeting_title TEXT,
  meeting_time TIMESTAMPTZ,
  meeting_duration_minutes INT,
  contact_name TEXT,
  contact_email TEXT,
  mode TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('auto','manual')),
  bant_total INT,
  deal_id uuid REFERENCES public.deals(id),
  brief_content JSONB DEFAULT '{}',
  questions JSONB DEFAULT '[]',
  key_alerts JSONB DEFAULT '[]',
  history_summary JSONB DEFAULT '[]',
  notion_page_id TEXT,
  email_sent_at TIMESTAMPTZ,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_briefs_workspace" ON public.meeting_briefs
  FOR ALL USING (is_workspace_member(workspace_id));

CREATE TABLE IF NOT EXISTS public.briefing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  auto_scan_enabled BOOLEAN NOT NULL DEFAULT true,
  include_email_history BOOLEAN NOT NULL DEFAULT true,
  include_call_history BOOLEAN NOT NULL DEFAULT true,
  generate_questions BOOLEAN NOT NULL DEFAULT true,
  auto_save_notion BOOLEAN NOT NULL DEFAULT true,
  notion_database_name TEXT DEFAULT 'SalesOS — Briefingi',
  send_email BOOLEAN NOT NULL DEFAULT true,
  send_telegram BOOLEAN NOT NULL DEFAULT false,
  email_address TEXT,
  minutes_before INT NOT NULL DEFAULT 60 CHECK (minutes_before IN (15,30,60,120,1440)),
  email_subject_template TEXT DEFAULT 'Briefing z dnia {data} — {firma}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.briefing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "briefing_settings_own" ON public.briefing_settings
  FOR ALL USING (user_id = auth.uid() AND is_workspace_member(workspace_id));
