-- ============================================================================
-- Migration 00015: Align Supabase Schema with SQLite (Source of Truth)
-- ============================================================================
--
-- SQLite is the local source of truth. This migration aligns Supabase to match.
-- This migration is IDEMPOTENT - safe to run multiple times.
--
-- Changes:
-- 1. inventory_items: Rename 'title' -> 'name' (if title exists)
-- 2. inventory_items: Rename 'notion_details' -> 'other_details' (if notion_details exists)
-- 3. inventory_items: DROP columns not in SQLite (min_quantity, reserved, etc.)
-- 4. project_status enum: Add SQLite values (to-do, on-hold, frogged)
--
-- @see lib/database/migrations.ts for SQLite schema
-- ============================================================================

-- ============================================================================
-- 1. RENAME INVENTORY_ITEMS COLUMNS (IDEMPOTENT)
-- ============================================================================

-- Rename 'title' to 'name' ONLY if 'title' exists and 'name' doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_items' AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_items' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.inventory_items RENAME COLUMN title TO name;
    RAISE NOTICE 'Renamed column title -> name';
  ELSE
    RAISE NOTICE 'Column rename title -> name skipped (already done or not needed)';
  END IF;
END $$;

-- Rename 'notion_details' to 'other_details' ONLY if 'notion_details' exists and 'other_details' doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_items' AND column_name = 'notion_details'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_items' AND column_name = 'other_details'
  ) THEN
    ALTER TABLE public.inventory_items RENAME COLUMN notion_details TO other_details;
    RAISE NOTICE 'Renamed column notion_details -> other_details';
  ELSE
    RAISE NOTICE 'Column rename notion_details -> other_details skipped (already done or not needed)';
  END IF;
END $$;

-- Update constraint for name column (if exists)
DO $$
BEGIN
  -- Drop old title_length constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'title_length' AND table_name = 'inventory_items'
  ) THEN
    ALTER TABLE public.inventory_items DROP CONSTRAINT title_length;
    RAISE NOTICE 'Dropped constraint title_length';
  END IF;

  -- Add name_length constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'name_length' AND table_name = 'inventory_items'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_items' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.inventory_items ADD CONSTRAINT name_length
      CHECK (char_length(name) >= 1 AND char_length(name) <= 200);
    RAISE NOTICE 'Added constraint name_length';
  END IF;
END $$;

-- Update index for renamed column
DROP INDEX IF EXISTS inventory_items_notion_details_gin_idx;
CREATE INDEX IF NOT EXISTS inventory_items_other_details_gin_idx
  ON public.inventory_items USING GIN(other_details);

-- ============================================================================
-- 2. DROP INVENTORY_ITEMS COLUMNS NOT IN SQLITE
-- ============================================================================

ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS min_quantity;
ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS reserved;
ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS reserved_for_project;
ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS last_used;
ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS upc_data;

-- ============================================================================
-- 3. UPDATE PROJECT_STATUS ENUM
-- ============================================================================

-- Add new SQLite-compatible status values (PostgreSQL ADD VALUE is idempotent with IF NOT EXISTS)
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'to-do';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'on-hold';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'frogged';

-- ============================================================================
-- 4. UPDATE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.inventory_items IS 'User inventory - schema aligned with SQLite (name, other_details)';
COMMENT ON COLUMN public.inventory_items.name IS 'Item name (matches SQLite schema)';
COMMENT ON COLUMN public.inventory_items.other_details IS 'JSONB containing other item details (matches SQLite other_details)';
