-- Create enums for inventory
CREATE TYPE public.inventory_category AS ENUM ('yarn', 'hook', 'notion', 'other');

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category public.inventory_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}' NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  min_quantity INTEGER,
  unit TEXT DEFAULT 'piece',

  -- Location & Organization
  location TEXT,
  tags TEXT[] DEFAULT '{}' NOT NULL,

  -- Project Association
  used_in_projects TEXT[] DEFAULT '{}' NOT NULL,
  reserved BOOLEAN DEFAULT FALSE NOT NULL,
  reserved_for_project TEXT,

  -- Common fields
  notes TEXT,
  barcode TEXT,
  date_added TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used TIMESTAMPTZ,

  -- Category-specific details stored as JSONB
  yarn_details JSONB,
  hook_details JSONB,
  notion_details JSONB,
  upc_data JSONB,

  CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT quantity_positive CHECK (quantity >= 0),
  CONSTRAINT min_quantity_positive CHECK (min_quantity IS NULL OR min_quantity >= 0)
);

-- Enable Row Level Security
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS inventory_items_user_id_idx ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS inventory_items_category_idx ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS inventory_items_date_added_idx ON public.inventory_items(date_added DESC);
CREATE INDEX IF NOT EXISTS inventory_items_user_category_idx ON public.inventory_items(user_id, category);

-- GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS inventory_items_tags_gin_idx ON public.inventory_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS inventory_items_yarn_details_gin_idx ON public.inventory_items USING GIN(yarn_details);
CREATE INDEX IF NOT EXISTS inventory_items_hook_details_gin_idx ON public.inventory_items USING GIN(hook_details);
CREATE INDEX IF NOT EXISTS inventory_items_notion_details_gin_idx ON public.inventory_items USING GIN(notion_details);

-- Add comments
COMMENT ON TABLE public.inventory_items IS 'User inventory of yarn, hooks, notions, and other supplies';
COMMENT ON COLUMN public.inventory_items.yarn_details IS 'JSONB containing yarn-specific details';
COMMENT ON COLUMN public.inventory_items.hook_details IS 'JSONB containing hook-specific details';
COMMENT ON COLUMN public.inventory_items.notion_details IS 'JSONB containing notion-specific details';
COMMENT ON COLUMN public.inventory_items.used_in_projects IS 'Array of project UUIDs';
