-- Storage Policies
-- Users can only access their own files in private buckets

-- ============================================================================
-- PROJECT IMAGES POLICIES
-- ============================================================================

-- Users can upload project images to their own folder
CREATE POLICY "Users can upload project images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own project images
CREATE POLICY "Users can view project images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own project images
CREATE POLICY "Users can update project images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own project images
CREATE POLICY "Users can delete project images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- PATTERN PDFs POLICIES
-- ============================================================================

CREATE POLICY "Users can upload pattern PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'pattern-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view pattern PDFs"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'pattern-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update pattern PDFs"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'pattern-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete pattern PDFs"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'pattern-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- INVENTORY IMAGES POLICIES
-- ============================================================================

CREATE POLICY "Users can upload inventory images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'inventory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view inventory images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'inventory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update inventory images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'inventory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete inventory images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'inventory-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- AVATARS POLICIES (PUBLIC BUCKET)
-- ============================================================================

CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
