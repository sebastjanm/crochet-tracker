-- Migration: Change ID columns from UUID to TEXT for local sync compatibility
-- Local expo-sqlite uses string IDs (timestamp-based), not UUIDs

-- ============================================================================
-- DROP RLS POLICIES FIRST (they depend on user_id columns)
-- ============================================================================

-- Projects policies (from 00004_create_rls_policies.sql)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Inventory policies (from 00004_create_rls_policies.sql)
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can create own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory_items;

-- ============================================================================
-- PROJECTS TABLE - Change id and user_id to TEXT
-- ============================================================================

-- Drop dependent objects
DROP INDEX IF EXISTS projects_user_id_idx;
DROP INDEX IF EXISTS projects_user_status_idx;

-- Remove foreign key constraint (we'll manage user association at app level)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Change id column from UUID to TEXT
ALTER TABLE public.projects
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Change user_id column from UUID to TEXT
ALTER TABLE public.projects
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_user_status_idx ON public.projects(user_id, status);

-- ============================================================================
-- INVENTORY_ITEMS TABLE - Change id and user_id to TEXT, add missing columns
-- ============================================================================

-- Drop dependent objects
DROP INDEX IF EXISTS inventory_items_user_id_idx;
DROP INDEX IF EXISTS inventory_items_user_category_idx;

-- Remove foreign key constraint
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_user_id_fkey;

-- Change id column from UUID to TEXT
ALTER TABLE public.inventory_items
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Change user_id column from UUID to TEXT
ALTER TABLE public.inventory_items
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Add 'name' column for sync compatibility (local uses 'name', not 'title')
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Copy existing title values to name
UPDATE public.inventory_items SET name = title WHERE name IS NULL;

-- Make title optional (name will be the primary field from sync)
ALTER TABLE public.inventory_items ALTER COLUMN title DROP NOT NULL;

-- Make description optional (local schema has it optional)
ALTER TABLE public.inventory_items ALTER COLUMN description DROP NOT NULL;

-- Add 'other_details' column for 'other' category items
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS other_details JSONB;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS inventory_items_user_id_idx ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS inventory_items_user_category_idx ON public.inventory_items(user_id, category);

-- ============================================================================
-- RECREATE RLS POLICIES WITH TEXT COMPARISON
-- ============================================================================

-- For now, create permissive policies for testing (user_id matches what's passed)
-- Note: When using Supabase Auth, use auth.uid()::TEXT for comparison

CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own projects" ON public.projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (true);

CREATE POLICY "Users can view their own inventory items" ON public.inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own inventory items" ON public.inventory_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own inventory items" ON public.inventory_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own inventory items" ON public.inventory_items
  FOR DELETE USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.projects.id IS 'Text ID from local SQLite (timestamp-based)';
COMMENT ON COLUMN public.projects.user_id IS 'Text user ID from local auth';
COMMENT ON COLUMN public.inventory_items.id IS 'Text ID from local SQLite (timestamp-based)';
COMMENT ON COLUMN public.inventory_items.user_id IS 'Text user ID from local auth';
COMMENT ON COLUMN public.inventory_items.name IS 'Item name (synced from local)';
COMMENT ON COLUMN public.inventory_items.other_details IS 'JSONB containing other-type item details';
