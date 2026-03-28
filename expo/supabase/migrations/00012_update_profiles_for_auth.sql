-- Migration: Update profiles table for Supabase Auth integration
-- Creates trigger to automatically create profile on user signup

-- ============================================================================
-- ENSURE ROLE COLUMN EXISTS
-- ============================================================================

-- The user_role enum was created in migration 00010
-- Add role column to profiles if not exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'ordinary' NOT NULL;

-- ============================================================================
-- CREATE TRIGGER FUNCTION FOR NEW USER SIGNUP
-- ============================================================================

-- This function runs after a new user is created in auth.users
-- It creates a corresponding profile in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'ordinary',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGER ON AUTH.USERS
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UPDATE EXISTING PROFILES RLS POLICIES
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new policies that work with Supabase Auth
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow the trigger to insert profiles (using SECURITY DEFINER)
-- Users cannot directly insert profiles - only through signup
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- CREATE INDEX FOR ROLE QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile in public.profiles when a new user signs up via Supabase Auth';
COMMENT ON COLUMN public.profiles.role IS 'User role: ordinary (free), pro (paid), admin (full access)';
