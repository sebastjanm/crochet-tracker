-- Create profiles table
-- This table extends auth.users with app-specific user data

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Add comments
COMMENT ON TABLE public.profiles IS 'User profile data extending auth.users';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to avatar image in Supabase Storage';
