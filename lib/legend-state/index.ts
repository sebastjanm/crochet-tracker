/**
 * Legend-State Module - Offline-First Sync
 *
 * Exports utilities for offline-first sync with Supabase.
 * Uses Supabase Realtime for live updates between devices.
 *
 * SQLite and Supabase schemas are aligned (SQLite = source of truth).
 * No field name or enum conversions needed.
 *
 * @see https://docs.expo.dev/guides/local-first/#legend-state
 * @see https://supabase.com/blog/local-first-expo-legend-state
 */

// Configuration and utilities
export { generateId } from './config';

// Type mappers for local ↔ cloud conversion
export {
  mapLocalProjectToCloud,
  mapCloudProjectToLocal,
  mapLocalInventoryToCloud,
  mapCloudInventoryToLocal,
} from './type-mappers';

// Sync Manager - Handles Supabase sync for Pro users
export {
  SyncManager,
  getSyncManager,
  cleanupSyncManager,
  type SyncResult,
  type SyncCallbacks,
} from './sync-manager';
