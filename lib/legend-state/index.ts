/**
 * Legend-State Module - Legend-State Native
 *
 * ARCHITECTURE: Legend-State Native
 * ===================================================
 * - Source of Truth: Legend-State Observables (projects$, inventory$)
 * - Persistence: AsyncStorage (Local First)
 * - Sync: Supabase (Automatic for Pro users)
 *
 * @see https://docs.expo.dev/guides/local-first/#legend-state
 * @see https://supabase.com/blog/local-first-expo-legend-state
 */

// Configuration and Legend-State store management
export {
  generateId,
  getStores,
  initializeLegendStateSync,
  addProject,
  updateProject,
  deleteProject,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from './config';

// Type mappers for local ↔ cloud conversion
export {
  mapLocalProjectToCloud,
  mapCloudProjectToLocal,
  mapLocalInventoryToCloud,
  mapCloudInventoryToLocal,
  getLocalImagesToUpload,
  filterLocalImages,
} from './type-mappers';

// Image sync queue - Persistent upload queue for images
export { imageSyncQueue, type ImageUploadCallbacks } from './image-sync-queue';
