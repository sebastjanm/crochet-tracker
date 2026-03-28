/**
 * Legend-State Configuration
 *
 * ARCHITECTURE: "Legend-State Native" (Source of Truth)
 * ====================================================
 * - Legend-State Observable = The SINGLE source of truth for the UI.
 * - Persistence = AsyncStorage (local-first guarantee).
 * - Sync = Supabase (attached only for Pro users).
 *
 * Data Flow:
 * 1. UI reads/writes directly to Legend-State Observable.
 * 2. Observable auto-persists to disk (AsyncStorage).
 * 3. If User is Pro: Observable auto-syncs to Supabase.
 *
 * @see https://legendapp.com/open-source/state/v3/sync/supabase/
 */

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { observable, syncState } from '@legendapp/state';
import { configureSynced, syncObservable } from '@legendapp/state/sync';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { syncedSupabase, configureSyncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';


// ============================================================================
// CONFIGURATION
// ============================================================================

// Create a singleton persistence plugin instance
const asyncStoragePlugin = observablePersistAsyncStorage({ AsyncStorage });

// Configure global sync defaults
configureSynced({
  persist: {
    plugin: asyncStoragePlugin,
  },
});

let isConfigured = false;

export function initializeLegendStateSync(): void {
  if (isConfigured) return;

  if (supabase) {
    configureSyncedSupabase({
      generateId: () => uuidv4(),
      // REMOVED: changesSince: 'last-sync' was causing sync issues
      // Each store can set this individually if needed
      // Standard field names (unified across ALL tables)
      fieldCreatedAt: 'created_at',
      fieldUpdatedAt: 'updated_at',
      // Soft delete via timestamp (NULL = active, timestamp = deleted)
      fieldDeleted: 'deleted_at',
    });
  }

  isConfigured = true;
  if (__DEV__) console.log('[LegendState] Configured (Persistence: AsyncStorage)');
}

// ============================================================================
// TYPES
// ============================================================================

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row'];

/**
 * Store types use 'any' because Legend-State's syncedSupabase returns
 * complex internal types that aren't exported. The observable is a
 * Record<string, Row> but with reactive capabilities that can't be
 * expressed in standard TypeScript without the library's internal types.
 *
 * @see https://legendapp.com/open-source/state/v3/sync/supabase/
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ProjectsStore = any;
export type InventoryStore = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// FACTORIES
// ============================================================================

export function generateId(): string {
  return uuidv4();
}

/**
 * Create a Store for Projects.
 * - Always persists locally.
 * - Syncs to Supabase IF userId is provided AND isPro is true.
 */
export function createProjectsStore(userId: string | null, isPro: boolean): any {
  initializeLegendStateSync();

  // 1. Base config: Local Persistence
  // Use a generic 'guest' key if no user, or user-specific key
  const persistKey = userId ? `projects_${userId}` : 'projects_guest';

  // DEBUG: Log all conditions
  if (__DEV__) {
    console.log(`[LegendState] createProjectsStore called:`, {
      userId: userId ? userId.substring(0, 8) + '...' : null,
      isPro,
      hasSupabase: !!supabase,
      willSync: !!(userId && isPro && supabase),
    });
  }

  // 2. Cloud Config (Only if Pro + Authed)
  if (userId && isPro && supabase) {
    if (__DEV__) {
      console.log(`[LegendState] Creating SYNCED projects store for ${userId}`);
    }

    // SyncedSupabase handles both local persistence AND cloud sync
    return observable(
      syncedSupabase({
        supabase,
        collection: 'projects',
        filter: (query: any) => query.eq('user_id', userId),
        actions: ['read', 'create', 'update', 'delete'],
        realtime: { filter: `user_id=eq.${userId}` },
        // REMOVED: changesSince: 'last-sync' was causing missed records
        // Full fetch is more reliable (can enable incremental later for efficiency)
        persist: {
          plugin: asyncStoragePlugin,
          name: persistKey,
          retrySync: true, // Retry failed syncs on reload
        },
        // DEBUG: Temporarily DISABLE infinite retry to see actual errors
        // retry: { infinite: true }, // DISABLED - was masking RLS/sync errors
        retry: {
          times: 3,
          delay: 1000,
          backoff: 'exponential',
        },
        as: 'object',
        // CRITICAL: Transform to strip null timestamp fields before INSERT
        // PostgreSQL NOT NULL constraint requires timestamps, but we want DB defaults
        // Legend-State sends null for undefined fields, so we strip them here
        transform: {
          save: (value: any) => {
            if (!value) return value;
            const result = { ...value };
            // Strip null/undefined timestamps - let DB set them via DEFAULT now()
            if (result.created_at === null || result.created_at === undefined) {
              delete result.created_at;
            }
            if (result.updated_at === null || result.updated_at === undefined) {
              delete result.updated_at;
            }
            return result;
          },
        },
        // Debug callbacks
        onError: (error: any) => {
          console.error('[LegendState] Projects Sync ERROR:', error);
          // Log full error details
          if (error?.message) console.error('[LegendState] Error message:', error.message);
          if (error?.code) console.error('[LegendState] Error code:', error.code);
          if (error?.details) console.error('[LegendState] Error details:', error.details);
          if (error?.hint) console.error('[LegendState] Error hint:', error.hint);
        },
        onSaved: () => {
          if (__DEV__) console.log('[LegendState] Projects SAVED to Supabase');
        },
      } as any)
    );
  }

  // 3. Local-Only Config (Free / Guest)
  if (__DEV__) console.log(`[LegendState] Creating LOCAL-ONLY projects store (${persistKey})`);
  const obs = observable({});
  
  // Attach persistence manually for local-only mode
  syncObservable(obs, {
    persist: {
      plugin: asyncStoragePlugin,
      name: persistKey,
    }
  });
  
  return obs;
}

/**
 * Create a Store for Inventory.
 */
export function createInventoryStore(userId: string | null, isPro: boolean): any {
  initializeLegendStateSync();

  const persistKey = userId ? `inventory_${userId}` : 'inventory_guest';

  if (userId && isPro && supabase) {
    if (__DEV__) {
      console.log(`[LegendState] Creating SYNCED inventory store for ${userId}`);
      console.log(`[LegendState] Persist key: ${persistKey}`);
    }

    return observable(
      syncedSupabase({
        supabase,
        collection: 'inventory_items',
        filter: (query: any) => query.eq('user_id', userId),
        actions: ['read', 'create', 'update', 'delete'],
        realtime: { filter: `user_id=eq.${userId}` },
        // Full fetch mode (no incremental sync) - simpler and more reliable
        // Can enable changesSince: 'last-sync' later for efficiency if needed
        persist: {
          plugin: asyncStoragePlugin,
          name: persistKey,
          retrySync: true,
        },
        // DEBUG: Temporarily DISABLE infinite retry to see actual errors
        // retry: { infinite: true }, // DISABLED - was masking RLS/sync errors
        retry: {
          times: 3,
          delay: 1000,
          backoff: 'exponential',
        },
        as: 'object',
        // CRITICAL: Transform to strip null timestamp fields before INSERT
        // PostgreSQL NOT NULL constraint requires timestamps, but we want DB defaults
        // Legend-State sends null for undefined fields, so we strip them here
        transform: {
          save: (value: any) => {
            if (!value) return value;
            const result = { ...value };
            // Strip null/undefined timestamps - let DB set them via DEFAULT now()
            if (result.created_at === null || result.created_at === undefined) {
              delete result.created_at;
            }
            if (result.updated_at === null || result.updated_at === undefined) {
              delete result.updated_at;
            }
            return result;
          },
        },
        onError: (error: any) => {
          console.error('[LegendState] Inventory Sync ERROR:', error);
          // Log full error details
          if (error?.message) console.error('[LegendState] Error message:', error.message);
          if (error?.code) console.error('[LegendState] Error code:', error.code);
          if (error?.details) console.error('[LegendState] Error details:', error.details);
          if (error?.hint) console.error('[LegendState] Error hint:', error.hint);
        },
        onSaved: () => {
          if (__DEV__) console.log('[LegendState] Inventory SAVED to Supabase');
        },
      } as any)
    );
  }

  if (__DEV__) console.log(`[LegendState] Creating LOCAL-ONLY inventory store (${persistKey})`);
  const obs = observable({});
  
  // Attach persistence manually
  syncObservable(obs, {
    persist: {
      plugin: asyncStoragePlugin,
      name: persistKey,
    }
  });

  return obs;
}

// ============================================================================
// STORE MANAGEMENT (Singleton Cache)
// ============================================================================

// We cache stores by "userId + isPro" signature to detect mode changes
const storeCache = new Map<string, { projects: any; inventory: any }>();

/**
 * Clear the in-memory store cache.
 * Call this before triggering a store re-creation to ensure fresh observables.
 */
export function clearStoreCache(): void {
  storeCache.clear();
  if (__DEV__) console.log('[LegendState] Store cache cleared');
}

/**
 * Get or create stores for a user. Cached by userId + isPro signature.
 */
export function getStores(userId: string | null, isPro: boolean) {
  const cacheKey = `${userId || 'guest'}_${isPro ? 'pro' : 'free'}`;

  let cached = storeCache.get(cacheKey);

  if (__DEV__) {
    console.log(`[LegendState] getStores called:`, {
      cacheKey,
      hasCached: !!cached,
      cacheSize: storeCache.size,
    });
  }

  if (!cached) {
    storeCache.clear();

    cached = {
      projects: createProjectsStore(userId, isPro),
      inventory: createInventoryStore(userId, isPro),
    };
    storeCache.set(cacheKey, cached);
  }

  return {
    projects$: cached.projects,
    inventory$: cached.inventory,
  };
}

/**
 * Reset stores for a specific user.
 *
 * Use this for admin/support scenarios where data was modified directly in
 * Supabase outside normal app flow (e.g., changing user_id on records).
 *
 * IMPORTANT: Legend-State uses changesSince: 'last-sync' for efficiency,
 * which means it cannot detect records that "disappeared" from a filter.
 * This function clears local cache, forcing a fresh fetch on next login.
 *
 * @see https://legendapp.com/open-source/state/v3/sync/supabase/
 */
export async function resetUserStores(userId: string): Promise<void> {
  // DEBUG: List all keys before clearing
  const allKeys = await AsyncStorage.getAllKeys();
  const userKeys = allKeys.filter(k => k.includes(userId));

  if (__DEV__) {
    console.log('[LegendState] All AsyncStorage keys:', allKeys);
    console.log('[LegendState] User-related keys to clear:', userKeys);
  }

  // AGGRESSIVE: Clear ALL keys containing userId
  // This catches any variation in key naming
  if (userKeys.length > 0) {
    await AsyncStorage.multiRemove(userKeys);
  }

  // Also clear the known standard keys (in case userId format differs)
  await AsyncStorage.multiRemove([
    `projects_${userId}`,
    `inventory_${userId}`,
    `projects_${userId}__m`,
    `inventory_${userId}__m`,
  ]);

  // Clear in-memory store cache to force new Observable creation
  storeCache.clear();

  if (__DEV__) console.log(`[LegendState] Reset complete for ${userId}`);
}

// ============================================================================
// SERVER-TRIGGERED DATA INVALIDATION
// ============================================================================

const LAST_VALID_DATA_KEY = '@last_valid_data_timestamp';

/**
 * Check if server has requested local data invalidation.
 * Admin can set `local_data_invalidated_at` on a user's profile to trigger this.
 *
 * @param userId - The user's ID
 * @param invalidatedAt - The timestamp from profile.local_data_invalidated_at
 * @returns true if data was cleared, false otherwise
 */
export async function checkAndClearInvalidatedData(
  userId: string,
  invalidatedAt: string | null
): Promise<boolean> {
  if (!invalidatedAt) return false; // No invalidation requested

  try {
    const lastValid = await AsyncStorage.getItem(LAST_VALID_DATA_KEY);
    const invalidationTime = new Date(invalidatedAt).getTime();
    const lastValidTime = lastValid ? parseInt(lastValid, 10) : 0;

    if (invalidationTime > lastValidTime) {
      // Clear user's local data AND metadata (for full re-sync)
      await AsyncStorage.multiRemove([
        // Data
        `projects_${userId}`,
        `inventory_${userId}`,
        // Metadata (contains last-sync timestamps)
        `projects_${userId}__m`,
        `inventory_${userId}__m`,
      ]);

      // Update last valid timestamp to prevent repeated clears
      await AsyncStorage.setItem(LAST_VALID_DATA_KEY, Date.now().toString());

      // Clear store cache to force new Observable creation
      storeCache.clear();

      if (__DEV__) {
        console.log('[LegendState] Cleared invalidated local data for', userId);
      }

      return true; // Data was cleared
    }

    return false; // No action needed (already processed this invalidation)
  } catch (error) {
    if (__DEV__) console.error('[LegendState] Error checking invalidation:', error);
    return false;
  }
}

// ============================================================================
// RECONCILIATION (Detect orphaned records)
// ============================================================================

/**
 * Reconcile local projects with Supabase.
 * Removes projects that exist locally but not on the server.
 *
 * This handles edge cases where data was modified directly in Supabase
 * (e.g., admin changed user_id, hard-deleted records, etc.)
 *
 * @see https://legendapp.com/open-source/state/v3/sync/supabase/
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function reconcileProjects(
  userId: string,
  projects$: any
): Promise<{ removed: number }> {
  if (!supabase) return { removed: 0 };

  try {
    // 1. Get local project IDs (exclude already soft-deleted)
    const localProjects = projects$.get() || {};
    const localIds = Object.keys(localProjects).filter(id => {
      const p = localProjects[id];
      return p && (p.deleted_at === null || p.deleted_at === undefined);
    });

    if (localIds.length === 0) return { removed: 0 };

    // 2. Fetch remote IDs (lightweight - only IDs)
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      if (__DEV__) console.error('[Reconcile] Projects failed:', error);
      return { removed: 0 };
    }

    const remoteIdSet = new Set(
      (data as Array<{ id: string }> | null)?.map(r => r.id) || []
    );

    // Safety check: If remote has NO data for this user, check if local data was ever synced.
    // This protects users who were never Pro (never synced) from losing local data,
    // while still cleaning up orphaned data for users whose data was transferred.
    if (remoteIdSet.size === 0 && localIds.length > 0) {
      // Check if ANY of the local IDs exist in Supabase (regardless of user_id)
      // If they exist under a different user_id, data was transferred → proceed
      // If they don't exist anywhere, user was never synced → skip
      const { data: anyExist } = await supabase
        .from('projects')
        .select('id')
        .in('id', localIds.slice(0, 10)) // Check first 10 for efficiency
        .limit(1);

      if (!anyExist || anyExist.length === 0) {
        if (__DEV__) console.log('[Reconcile] Local projects were never synced, skipping');
        return { removed: 0 };
      }
      // Data exists in Supabase under different user_id - proceed with reconciliation
      if (__DEV__) console.log('[Reconcile] Detected transferred projects, proceeding with cleanup');
    }

    // 3. Find orphans (local but not remote)
    const orphanIds = localIds.filter(id => !remoteIdSet.has(id));

    if (orphanIds.length === 0) return { removed: 0 };

    // 4. Soft-delete orphans locally
    const now = new Date().toISOString();
    orphanIds.forEach(id => {
      projects$[id].assign({ deleted_at: now });
    });

    if (__DEV__) {
      console.log(`[Reconcile] Removed ${orphanIds.length} orphaned projects`);
    }

    return { removed: orphanIds.length };
  } catch (err) {
    if (__DEV__) console.error('[Reconcile] Projects error:', err);
    return { removed: 0 };
  }
}

/**
 * Reconcile local inventory items with Supabase.
 * Removes items that exist locally but not on the server.
 */
export async function reconcileInventory(
  userId: string,
  inventory$: any
): Promise<{ removed: number }> {
  if (!supabase) return { removed: 0 };

  try {
    // 1. Get local inventory IDs (exclude already soft-deleted)
    const localItems = inventory$.get() || {};
    const localIds = Object.keys(localItems).filter(id => {
      const item = localItems[id];
      return item && (item.deleted_at === null || item.deleted_at === undefined);
    });

    if (localIds.length === 0) return { removed: 0 };

    // 2. Fetch remote IDs (lightweight - only IDs)
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      if (__DEV__) console.error('[Reconcile] Inventory failed:', error);
      return { removed: 0 };
    }

    const remoteIdSet = new Set(
      (data as Array<{ id: string }> | null)?.map(r => r.id) || []
    );

    // Safety check: If remote has NO data for this user, check if local data was ever synced.
    // This protects users who were never Pro (never synced) from losing local data,
    // while still cleaning up orphaned data for users whose data was transferred.
    if (remoteIdSet.size === 0 && localIds.length > 0) {
      // Check if ANY of the local IDs exist in Supabase (regardless of user_id)
      const { data: anyExist } = await supabase
        .from('inventory_items')
        .select('id')
        .in('id', localIds.slice(0, 10))
        .limit(1);

      if (!anyExist || anyExist.length === 0) {
        if (__DEV__) console.log('[Reconcile] Local inventory was never synced, skipping');
        return { removed: 0 };
      }
      if (__DEV__) console.log('[Reconcile] Detected transferred inventory, proceeding with cleanup');
    }

    // 3. Find orphans (local but not remote)
    const orphanIds = localIds.filter(id => !remoteIdSet.has(id));

    if (orphanIds.length === 0) return { removed: 0 };

    // 4. Soft-delete orphans locally
    const now = new Date().toISOString();
    orphanIds.forEach(id => {
      inventory$[id].assign({ deleted_at: now });
    });

    if (__DEV__) {
      console.log(`[Reconcile] Removed ${orphanIds.length} orphaned inventory items`);
    }

    return { removed: orphanIds.length };
  } catch (err) {
    if (__DEV__) console.error('[Reconcile] Inventory error:', err);
    return { removed: 0 };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// CRUD HELPERS (Now operating purely on Observables)
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
// Store parameters use 'any' due to Legend-State's internal observable types
// Data parameters are properly typed with Partial<Row> for type safety

export function addProject(
  projects$: any,
  userId: string | null,
  projectData: Partial<Omit<ProjectRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>>
): string {
  const id = generateId();

  // CRITICAL: For syncedSupabase with fieldCreatedAt configured,
  // created_at must be OMITTED (undefined) for CREATE operations.
  // Legend-State uses !created_at to detect new records.
  // If created_at has a value, it's treated as an UPDATE (existing record).
  // The server will set the actual timestamp on insert via DEFAULT now().
  // NOTE: We cannot pass null because PostgreSQL's NOT NULL constraint rejects it.
  const dataToSet: Record<string, unknown> = {
    ...projectData,
    id,
    user_id: userId, // Can be null for guest
    deleted_at: null, // NULL = active (no constraint issue, NULL is allowed)
  };

  // CRITICAL: Remove timestamps that may have been passed via projectData
  // The mapper includes them, but we need them ABSENT for CREATE detection
  delete dataToSet.created_at;
  delete dataToSet.updated_at;

  if (__DEV__) {
    console.log('[LegendState] addProject:', { id, title: projectData.title });
  }

  // Just write to the observable.
  // - If Synced: handles cloud + local.
  // - If Local: handles local.
  projects$[id].set(dataToSet);

  return id;
}

export function updateProject(
  projects$: any,
  id: string,
  updates: Partial<Omit<ProjectRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): void {
  const now = new Date().toISOString();
  projects$[id].assign({
    ...updates,
    updated_at: now,
  });
}

export function deleteProject(projects$: any, id: string): void {
  // Soft delete is handled by 'fieldDeleted' config in syncedSupabase
  projects$[id].delete();
}

export function addInventoryItem(
  inventory$: any,
  userId: string | null,
  itemData: Partial<Omit<InventoryItemRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>>
): string {
  const id = generateId();

  // CRITICAL: For syncedSupabase with fieldCreatedAt configured,
  // created_at must be OMITTED (undefined) for CREATE operations.
  // Legend-State uses !created_at to detect new records.
  // The server will set the actual timestamp on insert via DEFAULT now().
  const dataToSet: Record<string, unknown> = {
    ...itemData,
    id,
    user_id: userId,
    deleted_at: null, // NULL = active
  };

  // CRITICAL: Remove timestamps that may have been passed via itemData
  // The mapper includes them, but we need them ABSENT for CREATE detection
  delete dataToSet.created_at;
  delete dataToSet.updated_at;

  if (__DEV__) {
    console.log('[LegendState] addInventoryItem:', { id, name: itemData.name });
  }

  inventory$[id].set(dataToSet);

  return id;
}

export function updateInventoryItem(
  inventory$: any,
  id: string,
  updates: Partial<Omit<InventoryItemRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): void {
  const now = new Date().toISOString();
  inventory$[id].assign({
    ...updates,
    updated_at: now,
  });
}

export function deleteInventoryItem(inventory$: any, id: string): void {
  inventory$[id].delete();
}
/* eslint-enable @typescript-eslint/no-explicit-any */
