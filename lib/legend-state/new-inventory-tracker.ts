/**
 * New Inventory Tracker
 *
 * In-memory observable to track newly created inventory items.
 * When user creates yarn/hook from within a project form, this
 * allows auto-adding the new item to the project on return.
 *
 * NOTE: No persistence needed - only relevant during single navigation flow.
 */

import { observable } from '@legendapp/state';

// ============================================================================
// TYPES
// ============================================================================

export interface NewlyCreatedInventory {
  id: string;
  category: 'yarn' | 'hook' | 'other';
  name: string;
  createdAt: number;
}

// ============================================================================
// STORE
// ============================================================================

// In-memory only - no persistence (intentional)
export const newlyCreatedInventory$ = observable<NewlyCreatedInventory | null>(null);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Set the newly created inventory item.
 * Called after successful save in Add Inventory when returnTo='project-form'.
 */
export function setNewlyCreatedInventory(item: NewlyCreatedInventory): void {
  newlyCreatedInventory$.set(item);
  if (__DEV__) console.log('[NewInventoryTracker] Set new item:', item.name, item.category);
}

/**
 * Consume (get and clear) the newly created inventory item.
 * Called when project form regains focus to auto-add the item.
 * Returns null if no item was created.
 */
export function consumeNewlyCreatedInventory(): NewlyCreatedInventory | null {
  const item = newlyCreatedInventory$.get();
  if (item) {
    newlyCreatedInventory$.set(null);
    if (__DEV__) console.log('[NewInventoryTracker] Consumed new item:', item.name);
  }
  return item;
}

/**
 * Clear without consuming (e.g., if user cancelled project form).
 */
export function clearNewlyCreatedInventory(): void {
  newlyCreatedInventory$.set(null);
}
