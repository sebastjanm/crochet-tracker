-- Create project_status enum
CREATE TYPE public.project_status AS ENUM ('idea', 'in-progress', 'completed', 'maybe-someday');

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.project_status DEFAULT 'idea' NOT NULL,
  images TEXT[] DEFAULT '{}' NOT NULL,
  default_image_index INTEGER DEFAULT 0,
  pattern_pdf TEXT,
  inspiration_url TEXT,
  notes TEXT,
  yarn_used TEXT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT default_image_index_valid CHECK (default_image_index >= 0)
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS projects_user_status_idx ON public.projects(user_id, status);

-- Add comments
COMMENT ON TABLE public.projects IS 'User crochet projects';
COMMENT ON COLUMN public.projects.yarn_used IS 'Array of inventory_item UUIDs';
COMMENT ON COLUMN public.projects.images IS 'Array of image URLs from Supabase Storage';
