-- ============================================================================
-- Migration 00017: Add "Currently Working On" Feature
-- ============================================================================
--
-- Adds columns to track which projects are marked as "currently working on".
-- Users can mark up to 3 projects for quick access.
--
-- Matches SQLite V4 migration (lib/database/migrations.ts)
-- @see types/index.ts for Project interface
-- ============================================================================

-- Add currently_working_on boolean (default false)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS currently_working_on BOOLEAN NOT NULL DEFAULT FALSE;

-- Add timestamp when project was marked as "currently working on"
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS currently_working_on_at TIMESTAMPTZ;

-- Add timestamp when project was unmarked
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS currently_working_on_ended_at TIMESTAMPTZ;

-- Create index for quick access to active projects
CREATE INDEX IF NOT EXISTS idx_projects_currently_working_on
  ON public.projects(currently_working_on)
  WHERE currently_working_on = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN public.projects.currently_working_on IS 'Whether project is marked as currently being worked on (max 3 per user)';
COMMENT ON COLUMN public.projects.currently_working_on_at IS 'Timestamp when project was marked as currently working on';
COMMENT ON COLUMN public.projects.currently_working_on_ended_at IS 'Timestamp when project was unmarked from currently working on';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
