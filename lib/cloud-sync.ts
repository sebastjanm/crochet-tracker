/**
 * Cloud Sync Service
 *
 * Bidirectional sync between local SQLite and Supabase PostgreSQL.
 * Pro users only - gated by isPro check in calling code.
 *
 * Sync Strategy:
 * - Offline-first: Local SQLite is source of truth
 * - Last-write-wins: Conflicts resolved by updated_at timestamp
 * - Silent errors: Sync failures don't interrupt user flow
 *
 * @see /docs/SUPABASE_PLAN.md for database schema
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Project, InventoryItem } from '@/types';
import {
  ProjectRow,
  InventoryItemRow,
  mapRowToProject,
  mapRowToInventoryItem,
  now,
} from '@/lib/database/schema';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  pushed: { projects: number; inventory: number };
  pulled: { projects: number; inventory: number };
  errors: string[];
}

/**
 * SQLite bind value type - matches expo-sqlite's expected parameter types.
 */
type SQLiteBindValue = string | number | null | boolean | Uint8Array;

/**
 * Convert cloud value (unknown) to SQLite-compatible value.
 * Handles null/undefined conversion and JSON stringification for objects.
 */
function toSQLite(value: unknown): SQLiteBindValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (value instanceof Uint8Array) return value;
  // For arrays/objects (JSON columns from Supabase), they come as strings already
  // but if they somehow come as parsed objects, stringify them
  return JSON.stringify(value);
}

export interface SyncStatus {
  lastSyncAt: Date | null;
  pendingChanges: number;
  isOnline: boolean;
}

// Debounce state
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Perform a full sync cycle: claim orphaned records, push pending, pull cloud changes.
 * This is the main entry point for sync operations.
 *
 * @param db - SQLite database instance
 * @param userId - Current user's ID
 * @returns SyncResult with success status and counts
 */
export async function performSync(
  db: SQLiteDatabase,
  userId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    pushed: { projects: 0, inventory: 0 },
    pulled: { projects: 0, inventory: 0 },
    errors: [],
  };

  // DEBUG: Add user info to errors for visibility
  result.errors.push(`DEBUG: userId=${userId.substring(0, 8)}...`);

  // Skip if Supabase not configured
  if (!isSupabaseConfigured() || !supabase) {
    console.log('[CloudSync] Supabase not configured, skipping sync');
    result.errors.push('Supabase not configured');
    return result;
  }

  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('[CloudSync] Sync already in progress, skipping');
    result.errors.push('Sync already in progress');
    return result;
  }

  isSyncing = true;
  console.log('[CloudSync] Starting sync for user:', userId);

  try {
    // Step 1: Claim orphaned records (set user_id where NULL)
    const claimResult = await claimOrphanedRecords(db, userId);
    if (claimResult.claimed > 0) {
      result.errors.push(`Claimed ${claimResult.claimed} orphans`);
    }

    // Step 2: Push pending changes to cloud
    const pushResult = await pushPendingChanges(db, userId, result.errors);
    result.pushed = pushResult;

    // Step 3: Pull cloud changes to local
    const pullResult = await pullCloudChanges(db, userId, result.errors);
    result.pulled = pullResult;

    // Step 4: Update last sync timestamp
    await updateLastSyncTime(db);

    console.log('[CloudSync] Sync completed:', result);
  } catch (error) {
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    console.error('[CloudSync] Sync failed:', error);
  } finally {
    isSyncing = false;
  }

  return result;
}

/**
 * Debounced sync - triggers sync after 3 seconds of inactivity.
 * Use this after mutations to batch multiple changes.
 *
 * @param db - SQLite database instance
 * @param userId - Current user's ID
 */
export function debouncedSync(db: SQLiteDatabase, userId: string): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    performSync(db, userId).catch((error) => {
      console.error('[CloudSync] Debounced sync failed:', error);
    });
  }, 3000);
}

/**
 * Get current sync status for UI indicators.
 *
 * @param db - SQLite database instance
 * @returns SyncStatus with last sync time and pending count
 */
export async function getSyncStatus(db: SQLiteDatabase): Promise<SyncStatus> {
  const lastSync = await getLastSyncTime(db);
  const pendingProjects = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM projects WHERE pending_sync = 1'
  );
  const pendingInventory = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM inventory_items WHERE pending_sync = 1'
  );

  return {
    lastSyncAt: lastSync ? new Date(lastSync) : null,
    pendingChanges: (pendingProjects?.count ?? 0) + (pendingInventory?.count ?? 0),
    isOnline: isSupabaseConfigured(),
  };
}

// ============================================================================
// INTERNAL: CLAIM ORPHANED RECORDS
// ============================================================================

/**
 * Set user_id on records where it's NULL.
 * This "claims" existing local data for the logged-in user.
 */
async function claimOrphanedRecords(
  db: SQLiteDatabase,
  userId: string
): Promise<{ claimed: number }> {
  const projectsResult = await db.runAsync(
    'UPDATE projects SET user_id = ?, pending_sync = 1 WHERE user_id IS NULL',
    [userId]
  );

  const inventoryResult = await db.runAsync(
    'UPDATE inventory_items SET user_id = ?, pending_sync = 1 WHERE user_id IS NULL',
    [userId]
  );

  const totalClaimed = projectsResult.changes + inventoryResult.changes;

  if (totalClaimed > 0) {
    console.log(
      `[CloudSync] Claimed orphaned records: ${projectsResult.changes} projects, ${inventoryResult.changes} inventory`
    );
  }

  return { claimed: totalClaimed };
}

// ============================================================================
// INTERNAL: PUSH PENDING CHANGES
// ============================================================================

/**
 * Push all pending_sync=1 records to Supabase.
 */
async function pushPendingChanges(
  db: SQLiteDatabase,
  userId: string,
  debug: string[]
): Promise<{ projects: number; inventory: number }> {
  let projectsPushed = 0;
  let inventoryPushed = 0;

  console.log('[CloudSync] Push starting for userId:', userId);

  // First, check ALL pending projects (regardless of user_id)
  const allPending = await db.getAllAsync<{ id: string; user_id: string | null; pending_sync: number }>(
    'SELECT id, user_id, pending_sync FROM projects WHERE pending_sync = 1'
  );

  debug.push(`Local pending: ${allPending.length}`);
  const matching = allPending.filter(p => p.user_id === userId).length;
  debug.push(`Matching userId: ${matching}`);

  console.log('[CloudSync] All pending projects:', allPending.map(p => ({
    id: p.id,
    user_id: p.user_id,
    matches: p.user_id === userId
  })));

  // Push projects
  const pendingProjects = await db.getAllAsync<ProjectRow & { user_id: string }>(
    'SELECT * FROM projects WHERE pending_sync = 1 AND user_id = ?',
    [userId]
  );
  console.log('[CloudSync] Pending projects matching userId:', pendingProjects.length);

  for (const row of pendingProjects) {
    try {
      const cloudData = mapLocalProjectToCloud(row);
      console.log('[CloudSync] Pushing project:', row.id, row.title);

      const { error } = await supabase!
        .from('projects')
        .upsert(cloudData, { onConflict: 'id' });

      if (error) {
        console.error('[CloudSync] Supabase upsert error:', error);
        throw error;
      }

      // Mark as synced
      await db.runAsync(
        'UPDATE projects SET pending_sync = 0, synced_at = ? WHERE id = ?',
        [now(), row.id]
      );

      projectsPushed++;
      console.log('[CloudSync] Successfully pushed project:', row.id);
    } catch (error) {
      console.error('[CloudSync] Failed to push project:', row.id, error);
      // Keep pending_sync = 1, will retry on next sync
    }
  }

  // Push inventory items
  const pendingInventory = await db.getAllAsync<InventoryItemRow & { user_id: string }>(
    'SELECT * FROM inventory_items WHERE pending_sync = 1 AND user_id = ?',
    [userId]
  );

  for (const row of pendingInventory) {
    try {
      const cloudData = mapLocalInventoryToCloud(row);

      const { error } = await supabase!
        .from('inventory_items')
        .upsert(cloudData, { onConflict: 'id' });

      if (error) throw error;

      await db.runAsync(
        'UPDATE inventory_items SET pending_sync = 0, synced_at = ? WHERE id = ?',
        [now(), row.id]
      );

      inventoryPushed++;
    } catch (error) {
      console.error('[CloudSync] Failed to push inventory:', row.id, error);
    }
  }

  if (projectsPushed > 0 || inventoryPushed > 0) {
    console.log(`[CloudSync] Pushed: ${projectsPushed} projects, ${inventoryPushed} inventory`);
  }

  return { projects: projectsPushed, inventory: inventoryPushed };
}

// ============================================================================
// INTERNAL: PULL CLOUD CHANGES
// ============================================================================

/**
 * Pull cloud changes and merge into local SQLite.
 * Uses last-write-wins based on updated_at timestamp.
 */
async function pullCloudChanges(
  db: SQLiteDatabase,
  userId: string,
  debug: string[]
): Promise<{ projects: number; inventory: number }> {
  let projectsPulled = 0;
  let inventoryPulled = 0;

  // Get last sync time for incremental sync
  const lastSync = await getLastSyncTime(db);
  console.log('[CloudSync] Pull starting - lastSync:', lastSync, 'userId:', userId);

  // DEBUG: Force full sync by ignoring lastSync (remove after debugging)
  const forceFullSync = true;

  // Pull projects - get updated OR newly created since last sync
  let projectsQuery = supabase!
    .from('projects')
    .select('*')
    .eq('user_id', userId);

  if (lastSync && !forceFullSync) {
    // Pull records that were updated OR created after last sync
    console.log('[CloudSync] Applying incremental filter - OR(updated_at, created_at) > lastSync');
    projectsQuery = projectsQuery.or(`updated_at.gt.${lastSync},created_at.gt.${lastSync}`);
  } else {
    console.log('[CloudSync] Full sync - pulling ALL projects for user (forceFullSync:', forceFullSync, ')');
  }

  const { data: cloudProjects, error: projectsError } = await projectsQuery;

  // Add debug info about Supabase response
  debug.push(`Cloud projects: ${cloudProjects?.length ?? 0}`);
  if (projectsError) {
    debug.push(`Error: ${projectsError.message}`);
  }

  console.log('[CloudSync] Projects query result:', {
    count: cloudProjects?.length ?? 0,
    error: projectsError?.message,
    ids: cloudProjects?.map(p => p.id),
  });

  if (projectsError) {
    console.error('[CloudSync] Failed to pull projects:', projectsError);
  } else if (cloudProjects) {
    for (const cloudRow of cloudProjects) {
      const merged = await mergeCloudProject(db, cloudRow);
      if (merged) projectsPulled++;
    }
  }

  // Pull inventory items - get updated OR newly created since last sync
  let inventoryQuery = supabase!
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId);

  if (lastSync && !forceFullSync) {
    // Pull records that were updated OR created after last sync
    inventoryQuery = inventoryQuery.or(`last_updated.gt.${lastSync},date_added.gt.${lastSync}`);
  }

  const { data: cloudInventory, error: inventoryError } = await inventoryQuery;

  if (inventoryError) {
    console.error('[CloudSync] Failed to pull inventory:', inventoryError);
  } else if (cloudInventory) {
    for (const cloudRow of cloudInventory) {
      const merged = await mergeCloudInventory(db, cloudRow);
      if (merged) inventoryPulled++;
    }
  }

  if (projectsPulled > 0 || inventoryPulled > 0) {
    console.log(`[CloudSync] Pulled: ${projectsPulled} projects, ${inventoryPulled} inventory`);
  }

  return { projects: projectsPulled, inventory: inventoryPulled };
}

// ============================================================================
// INTERNAL: MERGE LOGIC (LAST-WRITE-WINS)
// ============================================================================

/**
 * Merge a cloud project into local SQLite.
 * Returns true if the local database was updated.
 */
async function mergeCloudProject(
  db: SQLiteDatabase,
  cloudRow: Record<string, unknown>
): Promise<boolean> {
  const cloudId = cloudRow.id as string;
  const cloudUpdatedAt = new Date(cloudRow.updated_at as string).getTime();

  const localRow = await db.getFirstAsync<ProjectRow>(
    'SELECT * FROM projects WHERE id = ?',
    [cloudId]
  );

  if (!localRow) {
    // New from cloud - insert locally
    await insertProjectFromCloud(db, cloudRow);
    return true;
  }

  const localUpdatedAt = new Date(localRow.updated_at).getTime();

  if (cloudUpdatedAt > localUpdatedAt) {
    // Cloud is newer - update local
    await updateProjectFromCloud(db, cloudRow);
    return true;
  }

  // Local is newer or equal - keep local (will be pushed on next sync if pending)
  return false;
}

/**
 * Merge a cloud inventory item into local SQLite.
 */
async function mergeCloudInventory(
  db: SQLiteDatabase,
  cloudRow: Record<string, unknown>
): Promise<boolean> {
  const cloudId = cloudRow.id as string;
  const cloudUpdatedAt = new Date(cloudRow.last_updated as string).getTime();

  const localRow = await db.getFirstAsync<InventoryItemRow>(
    'SELECT * FROM inventory_items WHERE id = ?',
    [cloudId]
  );

  if (!localRow) {
    await insertInventoryFromCloud(db, cloudRow);
    return true;
  }

  const localUpdatedAt = new Date(localRow.last_updated).getTime();

  if (cloudUpdatedAt > localUpdatedAt) {
    await updateInventoryFromCloud(db, cloudRow);
    return true;
  }

  return false;
}

// ============================================================================
// INTERNAL: INSERT/UPDATE FROM CLOUD
// ============================================================================

async function insertProjectFromCloud(
  db: SQLiteDatabase,
  cloudRow: Record<string, unknown>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO projects (
      id, title, description, status, project_type, images, default_image_index,
      pattern_pdf, pattern_url, pattern_images, inspiration_url, notes,
      yarn_used, yarn_used_ids, hook_used_ids, yarn_materials, work_progress,
      inspiration_sources, start_date, completed_date, created_at, updated_at,
      synced_at, pending_sync, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      toSQLite(cloudRow.id),
      toSQLite(cloudRow.title),
      toSQLite(cloudRow.description),
      toSQLite(cloudRow.status),
      toSQLite(cloudRow.project_type),
      toSQLite(cloudRow.images),
      toSQLite(cloudRow.default_image_index),
      toSQLite(cloudRow.pattern_pdf),
      toSQLite(cloudRow.pattern_url),
      toSQLite(cloudRow.pattern_images),
      toSQLite(cloudRow.inspiration_url),
      toSQLite(cloudRow.notes),
      toSQLite(cloudRow.yarn_used),
      toSQLite(cloudRow.yarn_used_ids),
      toSQLite(cloudRow.hook_used_ids),
      toSQLite(cloudRow.yarn_materials),
      toSQLite(cloudRow.work_progress),
      toSQLite(cloudRow.inspiration_sources),
      toSQLite(cloudRow.start_date),
      toSQLite(cloudRow.completed_date),
      toSQLite(cloudRow.created_at),
      toSQLite(cloudRow.updated_at),
      now(),
      0, // pending_sync = 0 (already in cloud)
      toSQLite(cloudRow.user_id),
    ]
  );
}

async function updateProjectFromCloud(
  db: SQLiteDatabase,
  cloudRow: Record<string, unknown>
): Promise<void> {
  await db.runAsync(
    `UPDATE projects SET
      title = ?, description = ?, status = ?, project_type = ?, images = ?,
      default_image_index = ?, pattern_pdf = ?, pattern_url = ?, pattern_images = ?,
      inspiration_url = ?, notes = ?, yarn_used = ?, yarn_used_ids = ?,
      hook_used_ids = ?, yarn_materials = ?, work_progress = ?, inspiration_sources = ?,
      start_date = ?, completed_date = ?, updated_at = ?, synced_at = ?, pending_sync = 0,
      user_id = ?
    WHERE id = ?`,
    [
      toSQLite(cloudRow.title),
      toSQLite(cloudRow.description),
      toSQLite(cloudRow.status),
      toSQLite(cloudRow.project_type),
      toSQLite(cloudRow.images),
      toSQLite(cloudRow.default_image_index),
      toSQLite(cloudRow.pattern_pdf),
      toSQLite(cloudRow.pattern_url),
      toSQLite(cloudRow.pattern_images),
      toSQLite(cloudRow.inspiration_url),
      toSQLite(cloudRow.notes),
      toSQLite(cloudRow.yarn_used),
      toSQLite(cloudRow.yarn_used_ids),
      toSQLite(cloudRow.hook_used_ids),
      toSQLite(cloudRow.yarn_materials),
      toSQLite(cloudRow.work_progress),
      toSQLite(cloudRow.inspiration_sources),
      toSQLite(cloudRow.start_date),
      toSQLite(cloudRow.completed_date),
      toSQLite(cloudRow.updated_at),
      now(),
      toSQLite(cloudRow.user_id),
      toSQLite(cloudRow.id),
    ]
  );
}

async function insertInventoryFromCloud(
  db: SQLiteDatabase,
  cloudRow: Record<string, unknown>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO inventory_items (
      id, category, name, description, images, quantity, unit,
      yarn_details, hook_details, other_details, location, tags,
      used_in_projects, notes, barcode, date_added, last_updated,
      synced_at, pending_sync, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      toSQLite(cloudRow.id),
      toSQLite(cloudRow.category),
      toSQLite(cloudRow.name),
      toSQLite(cloudRow.description),
      toSQLite(cloudRow.images),
      toSQLite(cloudRow.quantity) ?? 1,
      toSQLite(cloudRow.unit),
      toSQLite(cloudRow.yarn_details),
      toSQLite(cloudRow.hook_details),
      toSQLite(cloudRow.other_details),
      toSQLite(cloudRow.location),
      toSQLite(cloudRow.tags),
      toSQLite(cloudRow.used_in_projects),
      toSQLite(cloudRow.notes),
      toSQLite(cloudRow.barcode),
      toSQLite(cloudRow.date_added),
      toSQLite(cloudRow.last_updated),
      now(),
      0,
      toSQLite(cloudRow.user_id),
    ]
  );
}

async function updateInventoryFromCloud(
  db: SQLiteDatabase,
  cloudRow: Record<string, unknown>
): Promise<void> {
  await db.runAsync(
    `UPDATE inventory_items SET
      category = ?, name = ?, description = ?, images = ?, quantity = ?, unit = ?,
      yarn_details = ?, hook_details = ?, other_details = ?, location = ?, tags = ?,
      used_in_projects = ?, notes = ?, barcode = ?, last_updated = ?, synced_at = ?, pending_sync = 0,
      user_id = ?
    WHERE id = ?`,
    [
      toSQLite(cloudRow.category),
      toSQLite(cloudRow.name),
      toSQLite(cloudRow.description),
      toSQLite(cloudRow.images),
      toSQLite(cloudRow.quantity) ?? 1,
      toSQLite(cloudRow.unit),
      toSQLite(cloudRow.yarn_details),
      toSQLite(cloudRow.hook_details),
      toSQLite(cloudRow.other_details),
      toSQLite(cloudRow.location),
      toSQLite(cloudRow.tags),
      toSQLite(cloudRow.used_in_projects),
      toSQLite(cloudRow.notes),
      toSQLite(cloudRow.barcode),
      toSQLite(cloudRow.last_updated),
      now(),
      toSQLite(cloudRow.user_id),
      toSQLite(cloudRow.id),
    ]
  );
}

// ============================================================================
// INTERNAL: MAPPING LOCAL → CLOUD
// ============================================================================

/**
 * Map local ProjectRow to Supabase format.
 * Column names match between local and cloud.
 */
function mapLocalProjectToCloud(row: ProjectRow & { user_id: string }): Record<string, unknown> {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    project_type: row.project_type,
    images: row.images,
    default_image_index: row.default_image_index,
    pattern_pdf: row.pattern_pdf,
    pattern_url: row.pattern_url,
    pattern_images: row.pattern_images,
    inspiration_url: row.inspiration_url,
    notes: row.notes,
    yarn_used: row.yarn_used,
    yarn_used_ids: row.yarn_used_ids,
    hook_used_ids: row.hook_used_ids,
    yarn_materials: row.yarn_materials,
    work_progress: row.work_progress,
    inspiration_sources: row.inspiration_sources,
    start_date: row.start_date,
    completed_date: row.completed_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Map local InventoryItemRow to Supabase format.
 */
function mapLocalInventoryToCloud(row: InventoryItemRow & { user_id: string }): Record<string, unknown> {
  return {
    id: row.id,
    user_id: row.user_id,
    category: row.category,
    name: row.name,
    description: row.description,
    images: row.images,
    quantity: row.quantity,
    unit: row.unit,
    yarn_details: row.yarn_details,
    hook_details: row.hook_details,
    other_details: row.other_details,
    location: row.location,
    tags: row.tags,
    used_in_projects: row.used_in_projects,
    notes: row.notes,
    barcode: row.barcode,
    date_added: row.date_added,
    last_updated: row.last_updated,
  };
}

// ============================================================================
// INTERNAL: SYNC METADATA
// ============================================================================

async function getLastSyncTime(db: SQLiteDatabase): Promise<string | null> {
  const result = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = 'last_sync'"
  );
  return result?.value ?? null;
}

async function updateLastSyncTime(db: SQLiteDatabase): Promise<void> {
  const timestamp = now();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
     VALUES ('last_sync', ?, ?)`,
    [timestamp, timestamp]
  );
}
