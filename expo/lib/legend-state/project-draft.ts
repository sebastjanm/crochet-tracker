/**
 * Project Draft Store
 *
 * Persists project form state to survive navigation to Add Inventory
 * and back. Uses Legend-State with AsyncStorage persistence.
 *
 * @see https://legendapp.com/open-source/state/v3/sync/persist-sync/
 */

import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProjectImage } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

/** Yarn material with quantity for draft storage */
export interface DraftYarnMaterial {
  inventoryItemId: string;
  quantity: number;
}

/** Form state from add-project or edit-project screens */
export interface ProjectFormState {
  title: string;
  description: string;
  notes: string;
  inspirationUrl: string;
  images: ProjectImage[];
  defaultImageIndex: number;
  patternImages: string[];
  patternPdf: string;
  patternUrl: string;
  status: string;
  projectType: string | undefined;
  startDate: Date | undefined;
  yarnMaterials: Array<{ itemId: string; quantity: number }>;
  hookUsedIds: string[];
}

export interface ProjectDraft {
  // Form fields (all 14 from add-project.tsx)
  title: string;
  description: string;
  notes: string;
  inspirationUrl: string;
  images: ProjectImage[]; // Stores string URIs or ProjectImage objects
  defaultImageIndex: number;
  patternImages: string[]; // Pattern images as string URIs
  patternPdf: string;
  patternUrl: string;
  status: string;
  projectType: string;
  startDate: Date | undefined;
  yarnMaterials: DraftYarnMaterial[];
  hookUsedIds: string[];
  // Metadata
  lastUpdated: number;
  screenType: 'add' | 'edit';
  editProjectId?: string;
}

// ============================================================================
// STORE
// ============================================================================

// Create persistence plugin instance
const asyncStoragePlugin = observablePersistAsyncStorage({ AsyncStorage });

// Create the observable store (null when no draft exists)
export const projectDraft$ = observable<ProjectDraft | null>(null);

// Sync to AsyncStorage for persistence across app restarts
syncObservable(projectDraft$, {
  persist: {
    name: 'projectFormDraft',
    plugin: asyncStoragePlugin,
  },
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Save the current project form state as a draft.
 * Called before navigating to Add Inventory.
 */
export function saveProjectDraft(data: Omit<ProjectDraft, 'lastUpdated'>): void {
  projectDraft$.set({
    ...data,
    lastUpdated: Date.now(),
  });
  if (__DEV__) console.log('[ProjectDraft] Saved draft for', data.screenType);
}

/**
 * Clear the draft after successful save or explicit cancel.
 */
export function clearProjectDraft(): void {
  projectDraft$.set(null);
  if (__DEV__) console.log('[ProjectDraft] Cleared draft');
}

/**
 * Get the current draft if it exists.
 * Returns null if no draft is saved.
 */
export function getProjectDraft(): ProjectDraft | null {
  return projectDraft$.get();
}

/**
 * Save project form state as draft before navigating to Add Inventory.
 * Converts form state format to draft format.
 */
export function saveFormAsDraft(
  formState: ProjectFormState,
  screenType: 'add' | 'edit',
  editProjectId?: string
): void {
  saveProjectDraft({
    title: formState.title,
    description: formState.description,
    notes: formState.notes,
    inspirationUrl: formState.inspirationUrl,
    images: formState.images,
    defaultImageIndex: formState.defaultImageIndex,
    patternImages: formState.patternImages,
    patternPdf: formState.patternPdf,
    patternUrl: formState.patternUrl,
    status: formState.status,
    projectType: formState.projectType || '',
    startDate: formState.startDate,
    yarnMaterials: formState.yarnMaterials.map(ym => ({
      inventoryItemId: ym.itemId,
      quantity: ym.quantity,
    })),
    hookUsedIds: formState.hookUsedIds,
    screenType,
    editProjectId,
  });
}
