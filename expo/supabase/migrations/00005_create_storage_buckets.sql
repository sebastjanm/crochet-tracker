-- Create Storage Buckets
-- These buckets store user-uploaded images and PDFs

-- Project images bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Pattern PDFs bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pattern-pdfs',
  'pattern-pdfs',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Inventory images bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-images',
  'inventory-images',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;
