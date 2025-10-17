# Supabase Setup Guide

**Quick Start Guide for Setting Up Supabase Backend**

---

## 🎯 What's Been Prepared

✅ **Supabase client package installed** (`@supabase/supabase-js` v2.75.1)
✅ **Comprehensive database schema designed** (profiles, projects, inventory_items)
✅ **7 SQL migration files created** in `/supabase/migrations/`
✅ **Row Level Security policies defined** for all tables
✅ **Storage buckets planned** (project-images, pattern-pdfs, inventory-images, avatars)
✅ **Data migration script created** (`/scripts/migrate-to-supabase.ts`)
✅ **CLAUDE.md updated** with Supabase integration patterns
✅ **Environment variables documented** (`.env.example`)
✅ **Auth context updated** (`hooks/auth-context.tsx`) - ready to use Supabase Auth

---

## 🚀 Next Steps: Setting Up Your Supabase Project

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: Crochet Tracker (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier
4. Wait 2-3 minutes for project to be created

### Step 2: Get Your API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Set Environment Variables

1. Create a `.env` file in project root (it's gitignored):
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 4: Run Database Migrations

**Option A: Using Supabase Dashboard (Easiest)**

1. Go to **SQL Editor** in Supabase dashboard
2. Run each migration file in order:
   - `00001_create_profiles.sql`
   - `00002_create_projects.sql`
   - `00003_create_inventory_items.sql`
   - `00004_create_rls_policies.sql`
   - `00005_create_storage_buckets.sql`
   - `00006_create_storage_policies.sql`
   - `00007_create_triggers.sql`

3. Copy/paste the content of each file and click **"Run"**

**Option B: Using Supabase CLI (Advanced)**

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

### Step 5: Verify Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - ✅ profiles
   - ✅ projects
   - ✅ inventory_items

3. Go to **Storage** in dashboard
4. You should see these buckets:
   - ✅ project-images
   - ✅ pattern-pdfs
   - ✅ inventory-images
   - ✅ avatars

### Step 6: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - **Enable email confirmations**: Yes (recommended)
   - **Secure email change**: Yes
   - **Mailer** tab: Use built-in Supabase mailer for testing

### Step 7: Test Authentication

1. Restart your Expo dev server:
   ```bash
   bun run start
   ```

2. Try to register a new account
3. Check Supabase dashboard → **Authentication** → **Users**
4. You should see your new user!

---

## 📖 Key Documentation Files

- **`/docs/SUPABASE_PLAN.md`** - Complete architecture & schema details
- **`/supabase/migrations/`** - All SQL migration files
- **`/scripts/migrate-to-supabase.ts`** - Data migration helper
- **`/lib/supabase/client.ts`** - Supabase client configuration
- **`/hooks/auth-context.tsx`** - Updated auth with Supabase
- **`CLAUDE.md`** - Updated with Supabase patterns

---

## 🔄 Migrating Existing Data (Optional)

If users already have data in AsyncStorage:

1. Make sure user is logged in
2. Run the migration script:
   ```typescript
   import { migrateDataToSupabase } from './scripts/migrate-to-supabase';

   await migrateDataToSupabase();
   ```

3. Verify data in Supabase dashboard
4. Only after verification, clear local data if desired

---

## 🛠️ Implementation Checklist

Now that Supabase is set up, update the app code:

- [ ] Update `hooks/projects-context.tsx` to use Supabase queries
- [ ] Update `hooks/inventory-context.tsx` to use Supabase queries
- [ ] Create image upload helpers using Supabase Storage
- [ ] Test CRUD operations on projects
- [ ] Test CRUD operations on inventory
- [ ] Test image uploads
- [ ] Test authentication flows (register, login, logout, reset password)
- [ ] Test on both iOS and Android
- [ ] Implement offline support with TanStack Query
- [ ] Add real-time subscriptions (optional)

---

## 🔍 Troubleshooting

### "Missing environment variables" error
- Make sure `.env` file exists and has both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart Expo dev server after adding `.env`

### "relation does not exist" error
- Run all migrations in order
- Check SQL Editor for any migration errors

### "Row Level Security" blocking queries
- Make sure user is authenticated: `const { data: { user } } = await supabase.auth.getUser()`
- Verify RLS policies are created: Check **Authentication** → **Policies** in dashboard

### Images not uploading
- Check storage bucket exists
- Verify storage policies are created
- Check file path format: `{user_id}/{project_id}/{filename}`

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

---

## 🎉 You're Ready!

Once migrations are run and environment variables are set, your app is ready to use Supabase! Test the authentication flow first, then work on implementing the data contexts.

Good luck! 🚀
