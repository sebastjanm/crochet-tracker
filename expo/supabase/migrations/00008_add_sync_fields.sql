-- Migration: Add missing fields for SQLite sync compatibility
-- Aligns Supabase schema with local expo-sqlite schema

-- ============================================================================
-- UPDATE PROJECT STATUS ENUM
-- ============================================================================

-- Add missing status values to project_status enum
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'not-started';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'frogged';

-- ============================================================================
-- ADD MISSING COLUMNS TO PROJECTS TABLE
-- ============================================================================

-- Project type (amigurumi, garment, accessory, home-decor, other)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_type TEXT;

-- Pattern URL (separate from inspiration_url)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS pattern_url TEXT;

-- Pattern images array
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS pattern_images TEXT[] DEFAULT '{}';

-- Yarn used IDs (references to inventory_items)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS yarn_used_ids TEXT[] DEFAULT '{}';

-- Hook used IDs (references to inventory_items)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS hook_used_ids TEXT[] DEFAULT '{}';

-- Yarn materials with quantity tracking (JSONB for flexibility)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS yarn_materials JSONB DEFAULT '[]';

-- Work progress entries (JSONB array of {date, notes, progressPercent})
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS work_progress JSONB DEFAULT '[]';

-- Inspiration sources (JSONB array of {type, url, notes})
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS inspiration_sources JSONB DEFAULT '[]';

-- Project dates
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMPTZ;

-- Sync metadata
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- ============================================================================
-- ADD MISSING COLUMNS TO INVENTORY_ITEMS TABLE
-- ============================================================================

-- Sync metadata
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- ============================================================================
-- ADD INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS projects_project_type_idx ON public.projects(project_type);
CREATE INDEX IF NOT EXISTS projects_start_date_idx ON public.projects(start_date DESC);
CREATE INDEX IF NOT EXISTS projects_synced_at_idx ON public.projects(synced_at DESC);
CREATE INDEX IF NOT EXISTS inventory_items_synced_at_idx ON public.inventory_items(synced_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.projects.project_type IS 'Type of project: amigurumi, garment, accessory, home-decor, other';
COMMENT ON COLUMN public.projects.yarn_materials IS 'Array of {inventoryItemId, quantity, unit} for yarn tracking with amounts';
COMMENT ON COLUMN public.projects.work_progress IS 'Array of {date, notes, progressPercent} for progress tracking';
COMMENT ON COLUMN public.projects.start_date IS 'When the project was started';
COMMENT ON COLUMN public.projects.completed_date IS 'When the project was completed';
COMMENT ON COLUMN public.projects.synced_at IS 'Last sync timestamp for offline-first sync';
COMMENT ON COLUMN public.inventory_items.synced_at IS 'Last sync timestamp for offline-first sync';
