# Supabase Integration Plan

**Crochet Tracker - Database Architecture & Implementation Strategy**

---

## 🎯 Overview

This document outlines the complete Supabase integration plan for the Crochet Tracker app, including database schema, authentication, storage, and security policies.

### Goals
- **Sync across devices**: Users can access their projects and inventory from multiple devices
- **Secure authentication**: Email/password auth with row-level security
- **Media storage**: Efficient storage and delivery of project images and PDF patterns
- **Real-time updates**: Optional real-time sync between devices
- **Offline support**: Graceful degradation when offline, sync when back online

---

## 📊 Database Schema

### 1. `profiles` Table
Extends Supabase Auth users with app-specific data.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Foreign key to auth.users (UUID)
- `email`: User's email address
- `name`: Display name
- `avatar_url`: URL to avatar image in Supabase Storage
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `email`

---

### 2. `projects` Table
Stores crochet project information.

```sql
CREATE TYPE project_status AS ENUM ('idea', 'in-progress', 'completed', 'maybe-someday');

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status project_status DEFAULT 'idea' NOT NULL,
  images TEXT[] DEFAULT '{}', -- Array of storage URLs
  default_image_index INTEGER DEFAULT 0,
  pattern_pdf TEXT, -- Storage URL for PDF
  inspiration_url TEXT,
  notes TEXT,
  yarn_used TEXT[] DEFAULT '{}', -- Array of inventory_item IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `title`: Project name
- `description`: Project description
- `status`: Current project status (enum)
- `images`: Array of image URLs from Storage
- `default_image_index`: Index of the main project image
- `pattern_pdf`: URL to pattern PDF in Storage
- `inspiration_url`: External URL for inspiration
- `notes`: User notes
- `yarn_used`: Array of inventory item UUIDs
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `user_id` (for efficient user queries)
- Index on `status` (for filtering)
- Index on `created_at` (for sorting)

---

### 3. `inventory_items` Table
Stores yarn, hooks, notions, and other supplies.

```sql
CREATE TYPE inventory_category AS ENUM ('yarn', 'hook', 'notion', 'other');
CREATE TYPE fiber_type AS ENUM ('natural', 'synthetic', 'blend');
CREATE TYPE yarn_weight AS ENUM ('lace', 'fingering', 'sport', 'dk', 'worsted', 'bulky', 'super-bulky');
CREATE TYPE texture_type AS ENUM ('smooth', 'fuzzy', 'boucle', 'chenille', 'tweed', 'other');
CREATE TYPE twist_type AS ENUM ('low', 'medium', 'high');
CREATE TYPE handle_type AS ENUM ('ergonomic', 'inline', 'tapered', 'standard');
CREATE TYPE shaft_type AS ENUM ('inline', 'tapered');
CREATE TYPE notion_type AS ENUM ('stitch-marker', 'scissors', 'needle', 'gauge', 'row-counter', 'other');

CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category inventory_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  quantity INTEGER DEFAULT 1 NOT NULL,
  min_quantity INTEGER,
  unit TEXT DEFAULT 'piece',

  -- Location & Organization
  location TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Project Association
  used_in_projects TEXT[] DEFAULT '{}', -- Array of project UUIDs
  reserved BOOLEAN DEFAULT FALSE,
  reserved_for_project TEXT,

  -- Common fields
  notes TEXT,
  barcode TEXT,
  date_added TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ,

  -- Yarn-specific JSONB
  yarn_details JSONB,

  -- Hook-specific JSONB
  hook_details JSONB,

  -- Notion-specific JSONB
  notion_details JSONB,

  -- UPC Data JSONB
  upc_data JSONB
);
```

**Columns:**
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `category`: Item category (enum)
- `title`: Item name
- `description`: Item description
- `images`: Array of image URLs
- `quantity`: Current quantity
- `min_quantity`: Low stock alert threshold
- `unit`: Unit of measurement
- `location`: Storage location
- `tags`: Array of tags for filtering
- `used_in_projects`: Array of project UUIDs
- `reserved`: If item is reserved
- `reserved_for_project`: Project UUID if reserved
- `notes`: User notes
- `barcode`: Barcode/SKU
- `date_added`: Creation timestamp
- `last_updated`: Last update timestamp
- `last_used`: Last time item was used
- `yarn_details`: JSONB for yarn-specific data
- `hook_details`: JSONB for hook-specific data
- `notion_details`: JSONB for notion-specific data
- `upc_data`: JSONB for UPC scan data

**JSONB Schemas:**

**yarn_details:**
```json
{
  "brand": "string",
  "productName": "string",
  "sku": "string",
  "barcode": "string",
  "composition": "string",
  "fiberType": "natural|synthetic|blend",
  "weight": "number (grams)",
  "length": "number (meters)",
  "yarnWeight": "lace|fingering|sport|dk|worsted|bulky|super-bulky",
  "ply": "number",
  "needleSize": "string",
  "crochetHookSize": "string",
  "colorName": "string",
  "colorCode": "string",
  "dyelot": "string",
  "colorFamily": "string",
  "gauge": "string",
  "texture": "smooth|fuzzy|boucle|chenille|tweed|other",
  "twist": "low|medium|high",
  "washingInstructions": ["string"],
  "machineWashable": "boolean",
  "temperature": "string",
  "country": "string",
  "certificate": "string",
  "organic": "boolean",
  "sustainable": "boolean",
  "purchaseDate": "timestamp",
  "purchasePrice": "number",
  "purchaseLocation": "string",
  "supplier": "string"
}
```

**hook_details:**
```json
{
  "brand": "string",
  "model": "string",
  "sku": "string",
  "barcode": "string",
  "size": "string (required)",
  "sizeMetric": "number (mm)",
  "sizeUS": "string",
  "sizeUK": "string",
  "length": "number (cm)",
  "handleType": "ergonomic|inline|tapered|standard",
  "material": "aluminum|steel|plastic|bamboo|wood|resin|other",
  "handleMaterial": "string",
  "colorCoded": "boolean",
  "nonSlip": "boolean",
  "lightWeight": "boolean",
  "flexible": "boolean",
  "shaftType": "inline|tapered",
  "thumbRest": "boolean",
  "country": "string",
  "warranty": "string",
  "purchaseDate": "timestamp",
  "purchasePrice": "number",
  "purchaseLocation": "string"
}
```

**notion_details:**
```json
{
  "type": "stitch-marker|scissors|needle|gauge|row-counter|other",
  "brand": "string",
  "material": "string",
  "size": "string",
  "color": "string",
  "setSize": "number"
}
```

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `category`
- Index on `date_added`
- GIN index on `tags` for array queries
- GIN index on `yarn_details`, `hook_details`, `notion_details` for JSONB queries

---

## 🔐 Row Level Security (RLS) Policies

### Enable RLS

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
```

### `profiles` Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### `projects` Policies

```sql
-- Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

### `inventory_items` Policies

```sql
-- Users can view their own inventory
CREATE POLICY "Users can view own inventory"
  ON inventory_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own inventory items
CREATE POLICY "Users can create own inventory"
  ON inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own inventory items
CREATE POLICY "Users can update own inventory"
  ON inventory_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own inventory items
CREATE POLICY "Users can delete own inventory"
  ON inventory_items FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 📦 Supabase Storage

### Buckets

**1. `project-images`**
- **Purpose**: Store project photos
- **Public**: No (requires authentication)
- **File size limit**: 10MB per file
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Path structure**: `{user_id}/{project_id}/{image_id}.jpg`

**2. `pattern-pdfs`**
- **Purpose**: Store crochet pattern PDFs
- **Public**: No (requires authentication)
- **File size limit**: 50MB per file
- **Allowed MIME types**: `application/pdf`
- **Path structure**: `{user_id}/{project_id}/{pattern_name}.pdf`

**3. `inventory-images`**
- **Purpose**: Store yarn/hook/notion photos
- **Public**: No (requires authentication)
- **File size limit**: 10MB per file
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Path structure**: `{user_id}/{inventory_item_id}/{image_id}.jpg`

**4. `avatars`**
- **Purpose**: Store user profile avatars
- **Public**: Yes (avatars are publicly viewable)
- **File size limit**: 5MB per file
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Path structure**: `{user_id}/avatar.jpg`

### Storage Policies

```sql
-- Project images: Users can CRUD their own images
CREATE POLICY "Users can upload project images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view project images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update project images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete project images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Similar policies for pattern-pdfs, inventory-images, and avatars
-- (Repeat above pattern for each bucket)
```

---

## 🔑 Authentication Configuration

### Auth Providers
- **Email/Password**: Primary authentication method
- **Magic Link** (optional): Passwordless login
- **OAuth** (future): Google, Apple Sign-In

### Auth Settings
- **Email confirmation**: Required for new signups
- **Password reset**: Via email with deep link
- **Session duration**: 7 days
- **Refresh token rotation**: Enabled

### Deep Links
- **Password reset**: `crochettracker://reset-password?token={token}`
- **Email confirmation**: `crochettracker://confirm-email?token={token}`

---

## 🔄 Database Triggers & Functions

### 1. Auto-update `updated_at` Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Auto-create Profile on Signup

```sql
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Clean Up Storage on Project Delete

```sql
CREATE OR REPLACE FUNCTION delete_project_storage()
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

CREATE TRIGGER on_project_deleted
  AFTER DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION delete_project_storage();
```

---

## 📱 Client Integration Strategy

### 1. Supabase Client Setup
- Use `@supabase/supabase-js` with AsyncStorage for session persistence
- Single client instance exported from `lib/supabase/client.ts`

### 2. Authentication Flow
- Update `hooks/auth-context.tsx` to use Supabase Auth
- Listen for auth state changes with `onAuthStateChange`
- Auto-refresh sessions in background

### 3. Data Contexts
- Update `hooks/projects-context.tsx` to query Supabase instead of AsyncStorage
- Update `hooks/inventory-context.tsx` to query Supabase instead of AsyncStorage
- Use TanStack Query for caching and optimistic updates

### 4. Real-time Subscriptions (Optional)
```typescript
// Listen for project changes
supabase
  .channel('projects')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'projects',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Update local state
  })
  .subscribe();
```

### 5. Offline Support
- Use TanStack Query with `staleTime` and `cacheTime`
- Implement optimistic updates
- Queue mutations when offline, sync when online

---

## 🚀 Migration Strategy

### Phase 1: Setup Supabase Project
1. Create new Supabase project
2. Run schema migrations
3. Configure storage buckets
4. Set up RLS policies
5. Test with sample data

### Phase 2: Parallel Implementation
1. Keep existing AsyncStorage code working
2. Add Supabase integration alongside
3. Add feature flag to switch between backends

### Phase 3: Data Migration
1. Export existing AsyncStorage data
2. Transform to Supabase format
3. Import to user's Supabase account
4. Verify data integrity

### Phase 4: Cleanup
1. Remove AsyncStorage dependencies (keep for cache)
2. Remove old context logic
3. Update documentation

---

## 📝 SQL Migration Files

Create these files in `/supabase/migrations/`:

1. `00001_create_profiles.sql`
2. `00002_create_projects.sql`
3. `00003_create_inventory_items.sql`
4. `00004_create_rls_policies.sql`
5. `00005_create_storage_buckets.sql`
6. `00006_create_storage_policies.sql`
7. `00007_create_triggers.sql`

---

## ✅ Implementation Checklist

- [ ] Create Supabase project at https://supabase.com
- [ ] Set up database schema with SQL migrations
- [ ] Configure RLS policies
- [ ] Create storage buckets with policies
- [ ] Set up auth configuration
- [ ] Install `@supabase/supabase-js` package
- [ ] Create Supabase client (`lib/supabase/client.ts`)
- [ ] Set environment variables (`.env.example` created)
- [ ] Update `hooks/auth-context.tsx`
- [ ] Update `hooks/projects-context.tsx`
- [ ] Update `hooks/inventory-context.tsx`
- [ ] Test authentication flow
- [ ] Test data CRUD operations
- [ ] Test file upload/download
- [ ] Implement offline support
- [ ] Create data migration script
- [ ] Update CLAUDE.md with Supabase patterns
- [ ] Test on iOS and Android

---

## 🔗 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

**Next Steps**: Review this plan, then proceed with creating the Supabase project and running migrations.
