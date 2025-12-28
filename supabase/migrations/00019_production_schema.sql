-- ============================================================================
-- MIGRATION 00019: Clean Production Schema (Dev Mode - Drop & Recreate)
-- ============================================================================
-- Following official Supabase best practices:
-- - UUID primary keys with foreign key constraints
-- - Standard timestamp naming: created_at, updated_at, deleted_at
-- - Soft deletes via deleted_at timestamp (audit trail)
-- - RLS policies for multi-tenant security
-- - Optimized indexes
-- ============================================================================

-- Drop existing tables (dev mode - clean start)
DROP TABLE IF EXISTS yarn_brands CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop old enums if they exist
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS inventory_category CASCADE;

-- ============================================================================
-- ENUMS (Clean values only - no legacy)
-- ============================================================================
CREATE TYPE project_status AS ENUM ('to-do', 'in-progress', 'on-hold', 'completed', 'frogged');
CREATE TYPE inventory_category AS ENUM ('yarn', 'hook', 'other');

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE projects (
  -- Primary key: UUID for proper foreign key support
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to auth.users with cascade delete
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core fields
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  description TEXT DEFAULT '',
  status project_status NOT NULL DEFAULT 'to-do',
  project_type TEXT DEFAULT '',

  -- Images: TEXT[] arrays (native PostgreSQL arrays)
  images TEXT[] DEFAULT '{}',
  default_image_index INTEGER DEFAULT 0,
  pattern_images TEXT[] DEFAULT '{}',

  -- Pattern & Inspiration URLs
  pattern_pdf TEXT DEFAULT '',
  pattern_url TEXT DEFAULT '',
  inspiration_url TEXT DEFAULT '',

  -- Materials: Reference arrays (UUID[] for proper type safety)
  yarn_used TEXT[] DEFAULT '{}',           -- Legacy: descriptive names
  yarn_used_ids UUID[] DEFAULT '{}',       -- FK references to inventory
  hook_used_ids UUID[] DEFAULT '{}',       -- FK references to inventory

  -- Complex data: JSONB for structured objects
  yarn_materials JSONB DEFAULT '[]',       -- ProjectYarn[] with quantity
  work_progress JSONB DEFAULT '[]',        -- WorkProgressEntry[]
  inspiration_sources JSONB DEFAULT '[]',  -- InspirationSource[]

  -- Notes
  notes TEXT DEFAULT '',

  -- Date tracking
  start_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,

  -- Currently working on feature (max 3 active)
  currently_working_on BOOLEAN DEFAULT FALSE,
  currently_working_on_at TIMESTAMPTZ,
  currently_working_on_ended_at TIMESTAMPTZ,

  -- Standard timestamps (Supabase convention)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Soft delete: NULL = active, timestamp = deleted (audit trail)
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================================
-- INVENTORY_ITEMS TABLE
-- ============================================================================
CREATE TABLE inventory_items (
  -- Primary key: UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to auth.users
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core fields
  category inventory_category NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
  description TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit TEXT DEFAULT 'piece',

  -- Images & organization: TEXT[] arrays
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  used_in_projects UUID[] DEFAULT '{}',

  -- Location & identification
  location TEXT DEFAULT '',
  barcode TEXT DEFAULT '',
  notes TEXT DEFAULT '',

  -- Category-specific details: JSONB for complex objects
  yarn_details JSONB,
  hook_details JSONB,
  other_details JSONB,

  -- Standard timestamps (UNIFIED - same as projects)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Soft delete
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================================
-- YARN_BRANDS TABLE (User-learned autocomplete)
-- ============================================================================
CREATE TABLE yarn_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  display_name TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, name)
);

-- ============================================================================
-- INDEXES (Performance optimization)
-- ============================================================================

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_active ON projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_working ON projects(user_id) WHERE currently_working_on = TRUE;
CREATE INDEX idx_projects_updated ON projects(updated_at DESC);

-- Inventory indexes
CREATE INDEX idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_active ON inventory_items(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_tags ON inventory_items USING GIN(tags);
CREATE INDEX idx_inventory_updated ON inventory_items(updated_at DESC);
CREATE INDEX idx_inventory_barcode ON inventory_items(barcode) WHERE barcode != '';

-- Yarn brands index
CREATE INDEX idx_yarn_brands_user ON yarn_brands(user_id);
CREATE INDEX idx_yarn_brands_name ON yarn_brands(user_id, name);

-- ============================================================================
-- ROW LEVEL SECURITY (Multi-tenant isolation)
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE yarn_brands ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Inventory policies
CREATE POLICY "inventory_select" ON inventory_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "inventory_insert" ON inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inventory_update" ON inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "inventory_delete" ON inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- Yarn brands policies
CREATE POLICY "brands_select" ON yarn_brands
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "brands_insert" ON yarn_brands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "brands_update" ON yarn_brands
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "brands_delete" ON yarn_brands
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS (Auto-update updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER yarn_brands_updated_at
  BEFORE UPDATE ON yarn_brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- REALTIME (Enable for sync)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE yarn_brands;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE projects IS 'User crochet/knitting projects with materials and progress tracking';
COMMENT ON TABLE inventory_items IS 'User inventory: yarn, hooks, and other crafting supplies';
COMMENT ON TABLE yarn_brands IS 'User-learned yarn brand names for autocomplete';

COMMENT ON COLUMN projects.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN projects.yarn_materials IS 'JSONB array of {itemId, quantity} for yarn with quantity tracking';
COMMENT ON COLUMN projects.work_progress IS 'JSONB array of {id, date, notes} for work entries';
COMMENT ON COLUMN projects.currently_working_on IS 'Quick access flag, max 3 active projects allowed';

COMMENT ON COLUMN inventory_items.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN inventory_items.yarn_details IS 'JSONB with YarnDetails for yarn category items';
COMMENT ON COLUMN inventory_items.hook_details IS 'JSONB with HookDetails for hook category items';
COMMENT ON COLUMN inventory_items.used_in_projects IS 'UUID array of project IDs using this item';
