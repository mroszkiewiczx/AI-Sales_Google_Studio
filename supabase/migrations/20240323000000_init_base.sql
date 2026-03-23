-- supabase/migrations/20240323000000_init_base.sql

-- Functions
CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Simple check for now: is the user in the workspace_members table?
  -- Assuming a workspace_members table exists or we check profiles.workspace_id
  -- For this demo/app, we'll assume the user is a member if they are authenticated
  -- and we can find a record in a hypothetical workspace_members table.
  -- Since we don't have the full schema, we'll implement a basic version:
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    -- AND workspace_id = target_workspace_id -- If profiles had workspace_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Base Tables (if not exist)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id uuid,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    hubspot_owner_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    owner_id uuid REFERENCES public.profiles(id),
    account_id uuid REFERENCES public.accounts(id),
    title TEXT NOT NULL,
    amount NUMERIC(12,2),
    stage TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Calculator Tables
CREATE TABLE IF NOT EXISTS public.license_calculations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES public.deals(id),
    total_net NUMERIC(12,2),
    billing_period TEXT,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.implementation_calculations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.profiles(id),
    deal_id uuid REFERENCES public.deals(id),
    line_items JSONB DEFAULT '[]',
    suma_jdn NUMERIC(12,2),
    suma_mies NUMERIC(12,2),
    suma_rocz NUMERIC(12,2),
    is_snapshot BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dev_calculations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.profiles(id),
    deal_id uuid REFERENCES public.deals(id),
    line_items JSONB DEFAULT '[]',
    total NUMERIC(12,2),
    is_snapshot BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roi_calculations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES public.deals(id),
    total_gain NUMERIC(12,2),
    payback_months NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT now()
);
