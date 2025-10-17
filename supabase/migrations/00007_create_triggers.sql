-- Database Triggers and Functions
-- Automate common tasks like timestamp updates and cleanup

-- ============================================================================
-- AUTO-UPDATE updated_at TIMESTAMP
-- ============================================================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for inventory_items table (last_updated column)
CREATE OR REPLACE FUNCTION public.update_inventory_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_inventory_last_updated
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_last_updated();

-- ============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================

-- Function to create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CLEANUP STORAGE ON PROJECT DELETE
-- ============================================================================

-- Function to delete project-related storage files when project is deleted
CREATE OR REPLACE FUNCTION public.delete_project_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete project images from storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'project-images'
    AND name LIKE OLD.user_id || '/' || OLD.id || '/%';

  -- Delete pattern PDFs from storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'pattern-pdfs'
    AND name LIKE OLD.user_id || '/' || OLD.id || '/%';

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to cleanup storage on project delete
CREATE TRIGGER on_project_deleted
  AFTER DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_project_storage();

-- ============================================================================
-- CLEANUP STORAGE ON INVENTORY ITEM DELETE
-- ============================================================================

-- Function to delete inventory-related storage files when item is deleted
CREATE OR REPLACE FUNCTION public.delete_inventory_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete inventory images from storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'inventory-images'
    AND name LIKE OLD.user_id || '/' || OLD.id || '/%';

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to cleanup storage on inventory item delete
CREATE TRIGGER on_inventory_item_deleted
  AFTER DELETE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_inventory_storage();

-- ============================================================================
-- CLEANUP USER DATA ON USER DELETE
-- ============================================================================

-- Function to cleanup all user data when user account is deleted
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all user's storage objects
  DELETE FROM storage.objects
  WHERE name LIKE OLD.id::text || '/%';

  -- Cascade deletes will handle:
  -- - profiles (ON DELETE CASCADE)
  -- - projects (ON DELETE CASCADE)
  -- - inventory_items (ON DELETE CASCADE)

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to cleanup all user data on auth.users delete
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();
