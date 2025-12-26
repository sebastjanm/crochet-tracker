-- Migration: Add soft deletes and enable Realtime for Legend-State sync
-- Required for production-grade offline-first sync with Legend-State
-- @see https://legendapp.com/open-source/state/v3/sync/supabase/

-- ============================================================================
-- ADD SOFT DELETE COLUMNS
-- ============================================================================

-- Add deleted column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Add deleted column to inventory_items table
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Create indexes for filtering out deleted records efficiently
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON public.projects(deleted);
CREATE INDEX IF NOT EXISTS idx_inventory_deleted ON public.inventory_items(deleted);

-- Composite index for user + deleted (common query pattern)
CREATE INDEX IF NOT EXISTS idx_projects_user_deleted ON public.projects(user_id, deleted);
CREATE INDEX IF NOT EXISTS idx_inventory_user_deleted ON public.inventory_items(user_id, deleted);

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

-- Enable Realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Enable Realtime for inventory_items table
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;

-- ============================================================================
-- UPDATE RLS POLICIES TO EXCLUDE DELETED RECORDS
-- ============================================================================

-- Drop existing select policies and recreate with deleted filter
-- Note: The exact policy name depends on which migration was run
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can view their own inventory items" ON public.inventory_items;

-- New policies that filter out deleted records AND check user ownership
-- user_id is TEXT, auth.uid() returns UUID - cast to TEXT for comparison
CREATE POLICY "Users can view own non-deleted projects" ON public.projects
  FOR SELECT USING (auth.uid()::TEXT = user_id AND deleted = false);

CREATE POLICY "Users can view own non-deleted inventory" ON public.inventory_items
  FOR SELECT USING (auth.uid()::TEXT = user_id AND deleted = false);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.projects.deleted IS 'Soft delete flag for Legend-State sync';
COMMENT ON COLUMN public.inventory_items.deleted IS 'Soft delete flag for Legend-State sync';
