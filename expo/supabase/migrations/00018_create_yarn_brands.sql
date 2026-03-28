-- Migration: Create yarn_brands table for brand suggestions/autocomplete
-- This table stores user-learned yarn brands that sync between devices

-- Create yarn_brands table
CREATE TABLE IF NOT EXISTS public.yarn_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- Normalized: lowercase, trimmed for matching
  display_name TEXT NOT NULL,   -- Original casing for display
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- Add comment
COMMENT ON TABLE public.yarn_brands IS 'User-learned yarn brands for autocomplete suggestions';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_yarn_brands_user_id ON public.yarn_brands(user_id);
CREATE INDEX IF NOT EXISTS idx_yarn_brands_name ON public.yarn_brands(name);
CREATE INDEX IF NOT EXISTS idx_yarn_brands_user_name ON public.yarn_brands(user_id, name);

-- Enable Row Level Security
ALTER TABLE public.yarn_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own brands
CREATE POLICY "Users can view own brands"
  ON public.yarn_brands
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brands"
  ON public.yarn_brands
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands"
  ON public.yarn_brands
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brands"
  ON public.yarn_brands
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER set_yarn_brands_updated_at
  BEFORE UPDATE ON public.yarn_brands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable realtime for Pro users
ALTER PUBLICATION supabase_realtime ADD TABLE public.yarn_brands;
