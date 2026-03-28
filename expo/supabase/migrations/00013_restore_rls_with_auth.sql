-- Migration: Restore proper RLS policies with Supabase Auth
-- Replaces permissive USING(true) policies with auth.uid() checks

-- ============================================================================
-- DROP PERMISSIVE POLICIES
-- ============================================================================

-- Projects policies (from 00009_fix_id_types_for_sync.sql)
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Inventory policies (from 00009_fix_id_types_for_sync.sql)
DROP POLICY IF EXISTS "Users can view their own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert their own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete their own inventory items" ON public.inventory_items;

-- ============================================================================
-- PROJECTS POLICIES WITH SUPABASE AUTH
-- ============================================================================

-- user_id is TEXT, auth.uid() returns UUID - cast to TEXT for comparison
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can create own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid()::TEXT = user_id);

-- ============================================================================
-- INVENTORY_ITEMS POLICIES WITH SUPABASE AUTH
-- ============================================================================

CREATE POLICY "Users can view own inventory"
  ON public.inventory_items
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can create own inventory"
  ON public.inventory_items
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.inventory_items
  FOR UPDATE
  USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can delete own inventory"
  ON public.inventory_items
  FOR DELETE
  USING (auth.uid()::TEXT = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view own projects" ON public.projects IS
  'SELECT: Users can only view projects where user_id matches their auth.uid()';

COMMENT ON POLICY "Users can create own projects" ON public.projects IS
  'INSERT: Users can only create projects with their own auth.uid() as user_id';

COMMENT ON POLICY "Users can view own inventory" ON public.inventory_items IS
  'SELECT: Users can only view inventory items where user_id matches their auth.uid()';

COMMENT ON POLICY "Users can create own inventory" ON public.inventory_items IS
  'INSERT: Users can only create inventory items with their own auth.uid() as user_id';
