-- Row Level Security Policies
-- These policies ensure users can only access their own data

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INVENTORY_ITEMS POLICIES
-- ============================================================================

-- Users can view their own inventory
CREATE POLICY "Users can view own inventory"
  ON public.inventory_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own inventory items
CREATE POLICY "Users can create own inventory"
  ON public.inventory_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own inventory items
CREATE POLICY "Users can update own inventory"
  ON public.inventory_items
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own inventory items
CREATE POLICY "Users can delete own inventory"
  ON public.inventory_items
  FOR DELETE
  USING (auth.uid() = user_id);
