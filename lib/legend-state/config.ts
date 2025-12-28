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
import { observable } from '@legendapp/state';
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
      changesSince: 'last-sync',
      // Standard field names (unified across ALL tables)
      fieldCreatedAt: 'created_at',
      fieldUpdatedAt: 'updated_at',
      // Soft delete via timestamp (NULL = active, timestamp = deleted)
      fieldDeleted: 'deleted_at',
    });
  }

  isConfigured = true;
  console.log('[LegendState] Configured (Persistence: AsyncStorage)');
}

// ============================================================================
// TYPES
// ============================================================================

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row'];

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

  // 2. Cloud Config (Only if Pro + Authed)
  if (userId && isPro && supabase) {
    console.log(`[LegendState] Creating SYNCED projects store for ${userId}`);
    
    // SyncedSupabase handles both local persistence AND cloud sync
    return observable(
      syncedSupabase({
        supabase,
        collection: 'projects',
        filter: (query: any) => query.eq('user_id', userId),
        actions: ['read', 'create', 'update', 'delete'],
        realtime: { filter: `user_id=eq.${userId}` },
        persist: {
          plugin: asyncStoragePlugin,
          name: persistKey,
          retrySync: true, // Retry failed syncs on reload
        },
        retry: { infinite: true }, // Retry offline changes forever
        as: 'object',
      } as any)
    );
  }

  // 3. Local-Only Config (Free / Guest)
  console.log(`[LegendState] Creating LOCAL-ONLY projects store (${persistKey})`);
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
    console.log(`[LegendState] Creating SYNCED inventory store for ${userId}`);
    return observable(
      syncedSupabase({
        supabase,
        collection: 'inventory_items',
        filter: (query: any) => query.eq('user_id', userId),
        actions: ['read', 'create', 'update', 'delete'],
        realtime: { filter: `user_id=eq.${userId}` },
        // No field overrides needed - unified with global config
        persist: {
          plugin: asyncStoragePlugin,
          name: persistKey,
          retrySync: true,
        },
        retry: { infinite: true },
        as: 'object',
      } as any)
    );
  }

  console.log(`[LegendState] Creating LOCAL-ONLY inventory store (${persistKey})`);
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

export function getStores(userId: string | null, isPro: boolean) {
  const cacheKey = `${userId || 'guest'}_${isPro ? 'pro' : 'free'}`;
  
  let cached = storeCache.get(cacheKey);
  if (!cached) {
    // Clear old caches to free memory/prevent conflicts
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

// ============================================================================
// CRUD HELPERS (Now operating purely on Observables)
// ============================================================================

export function addProject(projects$: any, userId: string | null, projectData: any) {
  const id = generateId();
  const now = new Date().toISOString();

  // Just write to the observable.
  // - If Synced: handles cloud + local.
  // - If Local: handles local.
  projects$[id].set({
    ...projectData,
    id,
    user_id: userId, // Can be null for guest
    created_at: now,
    updated_at: now,
    deleted_at: null, // NULL = active
  });

  return id;
}

export function updateProject(projects$: any, id: string, updates: any) {
  const now = new Date().toISOString();
  projects$[id].assign({
    ...updates,
    updated_at: now,
  });
}

export function deleteProject(projects$: any, id: string) {
  // Soft delete is handled by 'fieldDeleted' config in syncedSupabase
  projects$[id].delete(); 
}

export function addInventoryItem(inventory$: any, userId: string | null, itemData: any) {
  const id = generateId();
  const now = new Date().toISOString();

  inventory$[id].set({
    ...itemData,
    id,
    user_id: userId,
    created_at: now,
    updated_at: now,
    deleted_at: null, // NULL = active
  });
  return id;
}

export function updateInventoryItem(inventory$: any, id: string, updates: any) {
  const now = new Date().toISOString();
  inventory$[id].assign({
    ...updates,
    updated_at: now,
  });
}

export function deleteInventoryItem(inventory$: any, id: string) {
  inventory$[id].delete();
}
