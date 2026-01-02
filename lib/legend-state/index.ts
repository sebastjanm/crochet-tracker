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
  resetUserStores,
  clearStoreCache,
  checkAndClearInvalidatedData,
  reconcileProjects,
  reconcileInventory,
  addProject,
  updateProject,
  deleteProject,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from './config';

// Image helpers for upload queue
export {
  getLocalImagesToUpload,
  filterLocalImages,
  isLocalImageUri,
  isCloudImageUrl,
  replaceImageUri,
} from './type-mappers';

// Image sync queue - Persistent upload queue for images
export { imageSyncQueue, type ImageUploadCallbacks } from './image-sync-queue';

// Project draft - Persists form state during navigation to Add Inventory
export {
  projectDraft$,
  clearProjectDraft,
  getProjectDraft,
  saveFormAsDraft,
  type ProjectDraft,
  type ProjectFormState,
} from './project-draft';

// New inventory tracker - Tracks newly created items for auto-add on return
export {
  newlyCreatedInventory$,
  setNewlyCreatedInventory,
  consumeNewlyCreatedInventory,
  clearNewlyCreatedInventory,
  type NewlyCreatedInventory,
} from './new-inventory-tracker';
