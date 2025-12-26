/**
 * Legend-State Configuration for Supabase Sync
 *
 * ARCHITECTURE: Offline-First with Cloud Sync
 * ============================================
 * - SQLite = Source of truth for ALL users (offline-first guarantee)
 * - Legend-State = Cloud sync layer for Pro users only
 *
 * Data Flow:
 * 1. All reads come from SQLite (works offline)
 * 2. All writes go to SQLite first (offline-first)
 * 3. For Pro users, writes also go to Legend-State (triggers cloud sync)
 * 4. Cloud updates via Legend-State → written back to SQLite
 *
 * This ensures the app works offline for everyone while Pro users
 * get automatic cloud sync when online.
 *
 * @see https://supabase.com/blog/local-first-expo-legend-state
 * @see https://docs.expo.dev/guides/local-first/#legend-state
 */

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { observable } from '@legendapp/state';
import {
  syncedSupabase,
  configureSyncedSupabase,
} from '@legendapp/state/sync-plugins/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

// ============================================================================
// TYPES
// ============================================================================

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row'];

// Legend-State v3 beta has complex types that cause excessive instantiation.
// We use 'any' for the observable wrapper but the data is typed via Supabase.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ProjectsStore = ReturnType<typeof observable<Record<string, ProjectRow>>>;
export type InventoryStore = ReturnType<typeof observable<Record<string, InventoryItemRow>>>;
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a UUID for new records.
 */
export function generateId(): string {
  return uuidv4();
}

// ============================================================================
// LEGEND-STATE SYNC CONFIGURATION
// ============================================================================

let isConfigured = false;

/**
 * Configure Legend-State Supabase sync with global defaults.
 * Must be called once before creating stores.
 */
export function initializeLegendStateSync(): void {
  if (isConfigured) return;
  if (!supabase) {
    console.warn('[LegendState] Supabase not configured, sync disabled');
    return;
  }

  // Configure global defaults for Legend-State Supabase sync
  // Options like retry, as, persist go in individual syncedSupabase() calls
  configureSyncedSupabase({
    // Field mappings for sync (these are global defaults)
    fieldCreatedAt: 'created_at',
    fieldUpdatedAt: 'updated_at',
    fieldDeleted: 'deleted',
    // Use last-sync for incremental updates
    changesSince: 'last-sync',
    // Generate UUIDs for new records
    generateId: () => uuidv4(),
  });

  isConfigured = true;
  console.log('[LegendState] Sync configured with Supabase');
}

// ============================================================================
// OBSERVABLE FACTORIES
// ============================================================================

/**
 * Create a synced projects observable for a user.
 * Automatically syncs with Supabase and persists locally.
 *
 * @param userId - The authenticated user's ID
 * @returns Observable of projects keyed by ID, or null if Supabase not configured
 */
export function createProjectsStore(userId: string): any {
  if (!supabase) {
    console.warn('[LegendState] Cannot create projects store - Supabase not configured');
    return null;
  }

  // Ensure global config is initialized
  initializeLegendStateSync();

  console.log(`[LegendState] Creating projects store for user: ${userId}`);

  // Using 'as any' to bypass Legend-State v3 beta type issues
  const syncConfig = syncedSupabase({
    supabase,
    collection: 'projects',
    // Filter by user and exclude deleted
    filter: (query: any) =>
      query.eq('user_id', userId).eq('deleted', false),
    // Enable all CRUD operations
    actions: ['read', 'create', 'update', 'delete'],
    // Enable realtime for this user's projects
    realtime: {
      filter: `user_id=eq.${userId}`,
    },
    // Persist with user-specific key
    persist: {
      name: `projects_${userId}`,
      retrySync: true,
    },
    // Return as object keyed by ID
    as: 'object',
    // Retry infinitely for offline-first
    retry: {
      infinite: true,
    },
  } as any);

  return observable(syncConfig as any);
}

/**
 * Create a synced inventory observable for a user.
 * Automatically syncs with Supabase and persists locally.
 *
 * @param userId - The authenticated user's ID
 * @returns Observable of inventory items keyed by ID, or null if Supabase not configured
 */
export function createInventoryStore(userId: string): any {
  if (!supabase) {
    console.warn('[LegendState] Cannot create inventory store - Supabase not configured');
    return null;
  }

  // Ensure global config is initialized
  initializeLegendStateSync();

  console.log(`[LegendState] Creating inventory store for user: ${userId}`);

  // Using 'as any' to bypass Legend-State v3 beta type issues
  const syncConfig = syncedSupabase({
    supabase,
    collection: 'inventory_items',
    // Filter by user and exclude deleted
    filter: (query: any) =>
      query.eq('user_id', userId).eq('deleted', false),
    // Enable all CRUD operations
    actions: ['read', 'create', 'update', 'delete'],
    // Enable realtime for this user's inventory
    realtime: {
      filter: `user_id=eq.${userId}`,
    },
    // Persist with user-specific key
    persist: {
      name: `inventory_${userId}`,
      retrySync: true,
    },
    // Return as object keyed by ID
    as: 'object',
    // Retry infinitely for offline-first
    retry: {
      infinite: true,
    },
  } as any);

  return observable(syncConfig as any);
}

// ============================================================================
// STORE MANAGEMENT
// ============================================================================

// Cache stores per user to avoid recreating
const storeCache = new Map<string, {
  projects: any;
  inventory: any;
}>();

/**
 * Get or create stores for a user.
 * Returns cached stores if they exist for the same user.
 */
export function getStores(userId: string): {
  projects$: any;
  inventory$: any;
} {
  let cached = storeCache.get(userId);

  if (!cached) {
    cached = {
      projects: createProjectsStore(userId),
      inventory: createInventoryStore(userId),
    };
    storeCache.set(userId, cached);
    console.log(`[LegendState] Created stores for user: ${userId}`);
  }

  return {
    projects$: cached.projects,
    inventory$: cached.inventory,
  };
}

/**
 * Clear stores for a user (call on logout).
 */
export function clearStores(userId?: string): void {
  if (userId) {
    storeCache.delete(userId);
    console.log(`[LegendState] Cleared stores for user: ${userId}`);
  } else {
    storeCache.clear();
    console.log('[LegendState] Cleared all stores');
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR CRUD OPERATIONS
// ============================================================================

/**
 * Add a project to the observable store.
 * Automatically syncs to Supabase.
 */
export function addProject(
  projects$: any,
  userId: string,
  project: Omit<ProjectRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'synced_at' | 'deleted'>
): string {
  const id = generateId();
  const now = new Date().toISOString();

  projects$[id].assign({
    ...project,
    id,
    user_id: userId,
    created_at: now,
    updated_at: now,
    synced_at: null,
    deleted: false,
  });

  console.log(`[LegendState] Added project: ${id}`);
  return id;
}

/**
 * Update a project in the observable store.
 */
export function updateProject(
  projects$: any,
  id: string,
  updates: Partial<Omit<ProjectRow, 'id' | 'user_id' | 'created_at'>>
): void {
  const now = new Date().toISOString();
  projects$[id].assign({
    ...updates,
    updated_at: now,
  });
  console.log(`[LegendState] Updated project: ${id}`);
}

/**
 * Delete a project (soft delete via Legend-State).
 */
export function deleteProject(projects$: any, id: string): void {
  projects$[id].deleted.set(true);
  projects$[id].updated_at.set(new Date().toISOString());
  console.log(`[LegendState] Soft deleted project: ${id}`);
}

/**
 * Add an inventory item to the observable store.
 */
export function addInventoryItem(
  inventory$: any,
  userId: string,
  item: Omit<InventoryItemRow, 'id' | 'user_id' | 'date_added' | 'last_updated' | 'synced_at' | 'deleted'>
): string {
  const id = generateId();
  const now = new Date().toISOString();

  inventory$[id].assign({
    ...item,
    id,
    user_id: userId,
    date_added: now,
    last_updated: now,
    synced_at: null,
    deleted: false,
  });

  console.log(`[LegendState] Added inventory item: ${id}`);
  return id;
}

/**
 * Update an inventory item in the observable store.
 */
export function updateInventoryItem(
  inventory$: any,
  id: string,
  updates: Partial<Omit<InventoryItemRow, 'id' | 'user_id' | 'date_added'>>
): void {
  const now = new Date().toISOString();
  inventory$[id].assign({
    ...updates,
    last_updated: now,
  });
  console.log(`[LegendState] Updated inventory item: ${id}`);
}

/**
 * Delete an inventory item (soft delete via Legend-State).
 */
export function deleteInventoryItem(inventory$: any, id: string): void {
  inventory$[id].deleted.set(true);
  inventory$[id].last_updated.set(new Date().toISOString());
  console.log(`[LegendState] Soft deleted inventory item: ${id}`);
}

// ============================================================================
// SCHEMA ALIGNMENT NOTE
// ============================================================================

/**
 * SQLite and Supabase schemas are aligned (as of migration 00015).
 *
 * Status values (same in both):
 * - 'to-do', 'in-progress', 'on-hold', 'completed', 'frogged'
 *
 * Category values (same in both):
 * - 'yarn', 'hook', 'other'
 *
 * Field names (same in both):
 * - inventory_items.name (not 'title')
 * - inventory_items.other_details (not 'notion_details')
 *
 * No conversion mappings are needed.
 */
