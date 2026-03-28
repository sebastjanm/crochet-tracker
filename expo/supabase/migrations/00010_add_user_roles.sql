-- Migration: Add user roles (admin, pro, ordinary)
-- Roles determine feature access and permissions

-- ============================================================================
-- CREATE ROLE ENUM
-- ============================================================================

CREATE TYPE public.user_role AS ENUM ('ordinary', 'pro', 'admin');

-- ============================================================================
-- ADD ROLE COLUMN TO PROFILES
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'ordinary' NOT NULL;

-- ============================================================================
-- CREATE INDEX FOR ROLE QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ============================================================================
-- ROLE PERMISSIONS REFERENCE (enforced in app code)
-- ============================================================================

-- | Feature                  | ordinary | pro | admin |
-- |--------------------------|----------|-----|-------|
-- | Local SQLite storage     | ✓        | ✓   | ✓     |
-- | Offline functionality    | ✓        | ✓   | ✓     |
-- | Basic inventory/projects | ✓        | ✓   | ✓     |
-- | Cloud sync (Supabase)    | ✗        | ✓   | ✓     |
-- | Cross-device sync        | ✗        | ✓   | ✓     |
-- | AI features              | Limited  | ✓   | ✓     |
-- | Priority support         | ✗        | ✓   | ✓     |
-- | Admin dashboard          | ✗        | ✗   | ✓     |
-- | Manage users             | ✗        | ✗   | ✓     |
-- | View analytics           | ✗        | ✗   | ✓     |

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.profiles.role IS 'User role: ordinary (free), pro (paid), admin (full access)';
COMMENT ON TYPE public.user_role IS 'User subscription/access level';
