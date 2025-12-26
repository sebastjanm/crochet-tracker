/**
 * Legend-State Module - Offline-First Sync
 *
 * ARCHITECTURE: SQLite + Legend-State for Cloud Sync
 * ===================================================
 * - SQLite = Source of truth for ALL users (offline-first guarantee)
 * - Legend-State = Cloud sync layer for Pro users only
 *
 * Data Flow:
 * 1. All reads come from SQLite (works offline)
 * 2. All writes go to SQLite first (offline-first)
 * 3. For Pro users, writes also go to Legend-State (triggers cloud sync)
 * 4. Cloud updates via Legend-State → written back to SQLite
 *
 * @see https://docs.expo.dev/guides/local-first/#legend-state
 * @see https://supabase.com/blog/local-first-expo-legend-state
 */

// Configuration and Legend-State store management
export {
  generateId,
  getStores,
  clearStores,
  initializeLegendStateSync,
} from './config';

// Type mappers for local ↔ cloud conversion
export {
  mapLocalProjectToCloud,
  mapCloudProjectToLocal,
  mapLocalInventoryToCloud,
  mapCloudInventoryToLocal,
} from './type-mappers';

// Image sync queue - Persistent upload queue for images
export { imageSyncQueue, type ImageUploadCallbacks } from './image-sync-queue';

// Legacy SyncManager exports for backward compatibility
// These are used by profile.tsx for image management features
// TODO: Migrate these to separate image management module
export {
  getSyncManager,
  cleanupSyncManager,
  type SyncResult,
} from './sync-manager';
