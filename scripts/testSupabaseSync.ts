/**
 * Test Script: Verify Supabase Sync Works
 *
 * Run this to check if data can be fetched from Supabase.
 * Usage: bunx tsx scripts/testSupabaseSync.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Breda's user ID
const TEST_USER_ID = '46265084-28e1-4bc6-8f8f-d1d5ea90cd63';

async function main() {
  console.log('=== Supabase Sync Test ===\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Check Profile
  console.log('1. Fetching profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, role, local_data_invalidated_at')
    .eq('id', TEST_USER_ID)
    .single();

  if (profileError) {
    console.error('❌ Profile error:', profileError.message);
  } else {
    console.log('✅ Profile:', {
      name: profile.name,
      email: profile.email,
      role: profile.role,
      invalidatedAt: profile.local_data_invalidated_at,
    });
  }

  // 2. Check Projects for this user
  console.log('\n2. Fetching projects for user...');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, status, deleted_at')
    .eq('user_id', TEST_USER_ID)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (projectsError) {
    console.error('❌ Projects error:', projectsError.message);
  } else {
    console.log(`✅ Found ${projects?.length || 0} active projects:`);
    projects?.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} (${p.status})`);
    });
  }

  // 3. Check Inventory for this user
  console.log('\n3. Fetching inventory for user...');
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory_items')
    .select('id, name, category, deleted_at')
    .eq('user_id', TEST_USER_ID)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (inventoryError) {
    console.error('❌ Inventory error:', inventoryError.message);
  } else {
    console.log(`✅ Found ${inventory?.length || 0} active inventory items:`);
    inventory?.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name} (${item.category})`);
    });
  }

  // 4. Check ALL projects (any user) to see where data is
  console.log('\n4. Checking ALL projects in database...');
  const { data: allProjects, error: allError } = await supabase
    .from('projects')
    .select('id, title, user_id, deleted_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (allError) {
    console.error('❌ All projects error:', allError.message);
  } else {
    console.log(`✅ Total active projects in DB: ${allProjects?.length || 0}`);

    // Group by user_id
    const byUser = new Map<string, number>();
    allProjects?.forEach(p => {
      const count = byUser.get(p.user_id) || 0;
      byUser.set(p.user_id, count + 1);
    });

    console.log('   Projects per user_id:');
    byUser.forEach((count, userId) => {
      const marker = userId === TEST_USER_ID ? ' ← Breda' : '';
      console.log(`   • ${userId.slice(0, 8)}...: ${count} projects${marker}`);
    });
  }

  // 5. Summary
  console.log('\n=== Summary ===');
  console.log(`Profile: ${profile ? '✅' : '❌'}`);
  console.log(`Projects for Breda: ${projects?.length || 0}`);
  console.log(`Inventory for Breda: ${inventory?.length || 0}`);

  if ((projects?.length || 0) === 0 && (inventory?.length || 0) === 0) {
    console.log('\n⚠️  Breda has NO data in Supabase!');
    console.log('   This explains why "Refresh from Cloud" shows nothing.');
    console.log('   Data might be under a different user_id.');
  }
}

main().catch(console.error);
