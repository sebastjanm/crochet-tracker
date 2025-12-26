/**
 * Bidirectional Sync Service
 *
 * Handles synchronization between Projects and Inventory items.
 * When materials are added/removed from a project, this updates the inventory items' usedInProjects.
 * When projects are added/removed from an inventory item, this updates the projects' yarnUsedIds/hookUsedIds.
 *
 * This follows the service layer pattern - sync logic lives in one place,
 * avoiding circular dependencies between contexts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InventoryItem, Project } from '@/types';

const INVENTORY_KEY = 'inventory';
const PROJECTS_KEY = 'projects';

// ============================================================================
// Internal Helpers
// ============================================================================

async function loadInventory(): Promise<InventoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(INVENTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[sync] Failed to load inventory:', error);
    return [];
  }
}

async function saveInventory(items: InventoryItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[sync] Failed to save inventory:', error);
    throw error;
  }
}

async function loadProjects(): Promise<Project[]> {
  try {
    const data = await AsyncStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[sync] Failed to load projects:', error);
    return [];
  }
}

async function saveProjects(projects: Project[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('[sync] Failed to save projects:', error);
    throw error;
  }
}

// ============================================================================
// Project -> Inventory Sync (called when editing/creating projects)
// ============================================================================

/**
 * Sync inventory items when project materials change.
 * Updates the `usedInProjects` array on affected inventory items.
 *
 * @param projectId - The project being updated
 * @param newYarnIds - New yarn IDs after the update
 * @param newHookIds - New hook IDs after the update
 * @param oldYarnIds - Previous yarn IDs before the update
 * @param oldHookIds - Previous hook IDs before the update
 * @returns Updated inventory items (for context to refresh state)
 */
export async function syncProjectMaterials(
  projectId: string,
  newYarnIds: string[],
  newHookIds: string[],
  oldYarnIds: string[],
  oldHookIds: string[]
): Promise<InventoryItem[]> {
  const items = await loadInventory();

  // Calculate what changed
  const addedIds = [
    ...newYarnIds.filter(id => !oldYarnIds.includes(id)),
    ...newHookIds.filter(id => !oldHookIds.includes(id)),
  ];
  const removedIds = [
    ...oldYarnIds.filter(id => !newYarnIds.includes(id)),
    ...oldHookIds.filter(id => !newHookIds.includes(id)),
  ];

  // Early exit if nothing changed
  if (addedIds.length === 0 && removedIds.length === 0) {
    console.log('[sync] No material changes detected, skipping sync');
    return items;
  }

  console.log('[sync] syncProjectMaterials:', {
    projectId,
    added: addedIds,
    removed: removedIds,
  });

  let hasChanges = false;

  // Update inventory items
  const updated = items.map(item => {
    const usedIn = item.usedInProjects || [];
    let newUsedIn = [...usedIn];

    // Add project to newly added materials
    if (addedIds.includes(item.id) && !newUsedIn.includes(projectId)) {
      newUsedIn.push(projectId);
    }

    // Remove project from removed materials
    if (removedIds.includes(item.id)) {
      newUsedIn = newUsedIn.filter(id => id !== projectId);
    }

    // Check if this item changed
    if (JSON.stringify(usedIn) !== JSON.stringify(newUsedIn)) {
      hasChanges = true;
      return {
        ...item,
        usedInProjects: newUsedIn.length > 0 ? newUsedIn : undefined,
        lastUpdated: new Date(),
      };
    }
    return item;
  });

  if (hasChanges) {
    await saveInventory(updated);
    console.log('[sync] Inventory updated with project references');
  }

  return updated;
}

/**
 * Remove project reference from all inventory items.
 * Called when a project is deleted.
 *
 * @param projectId - The project being deleted
 * @returns Updated inventory items (for context to refresh state)
 */
export async function removeProjectFromInventory(
  projectId: string
): Promise<InventoryItem[]> {
  const items = await loadInventory();

  console.log('[sync] removeProjectFromInventory:', projectId);

  let hasChanges = false;

  const updated = items.map(item => {
    if (item.usedInProjects?.includes(projectId)) {
      hasChanges = true;
      const newUsedIn = item.usedInProjects.filter(id => id !== projectId);
      return {
        ...item,
        usedInProjects: newUsedIn.length > 0 ? newUsedIn : undefined,
        lastUpdated: new Date(),
      };
    }
    return item;
  });

  if (hasChanges) {
    await saveInventory(updated);
    console.log('[sync] Cleaned up inventory after project deletion');
  }

  return updated;
}

// ============================================================================
// Inventory -> Project Sync (called when editing inventory usedInProjects)
// ============================================================================

/**
 * Sync projects when inventory item's usedInProjects changes.
 * Updates the `yarnUsedIds` or `hookUsedIds` array on affected projects.
 *
 * @param itemId - The inventory item being updated
 * @param itemCategory - The category of the item ('yarn', 'hook', or 'other')
 * @param newProjectIds - New project IDs after the update
 * @param oldProjectIds - Previous project IDs before the update
 * @returns Updated projects (for context to refresh state)
 */
export async function syncInventoryToProjects(
  itemId: string,
  itemCategory: 'yarn' | 'hook' | 'other',
  newProjectIds: string[],
  oldProjectIds: string[]
): Promise<Project[]> {
  // 'other' category items don't link to projects
  if (itemCategory === 'other') {
    console.log('[sync] Skipping sync for "other" category item');
    return await loadProjects();
  }

  const projects = await loadProjects();

  const addedProjects = newProjectIds.filter(id => !oldProjectIds.includes(id));
  const removedProjects = oldProjectIds.filter(id => !newProjectIds.includes(id));

  // Early exit if nothing changed
  if (addedProjects.length === 0 && removedProjects.length === 0) {
    console.log('[sync] No project changes detected, skipping sync');
    return projects;
  }

  console.log('[sync] syncInventoryToProjects:', {
    itemId,
    category: itemCategory,
    added: addedProjects,
    removed: removedProjects,
  });

  const field = itemCategory === 'yarn' ? 'yarnUsedIds' : 'hookUsedIds';

  let hasChanges = false;

  const updated = projects.map(project => {
    const currentIds: string[] = (project[field] as string[] | undefined) || [];
    let newIds = [...currentIds];

    // Add item to newly added projects
    if (addedProjects.includes(project.id) && !newIds.includes(itemId)) {
      newIds.push(itemId);
    }

    // Remove item from removed projects
    if (removedProjects.includes(project.id)) {
      newIds = newIds.filter(id => id !== itemId);
    }

    // Check if this project changed
    if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
      hasChanges = true;
      return {
        ...project,
        [field]: newIds.length > 0 ? newIds : undefined,
        updatedAt: new Date(),
      };
    }
    return project;
  });

  if (hasChanges) {
    await saveProjects(updated);
    console.log('[sync] Projects updated with inventory references');
  }

  return updated;
}

/**
 * Remove inventory item reference from all projects.
 * Called when an inventory item is deleted.
 *
 * @param itemId - The inventory item being deleted
 * @param itemCategory - The category of the item
 * @returns Updated projects (for context to refresh state)
 */
export async function removeInventoryFromProjects(
  itemId: string,
  itemCategory: 'yarn' | 'hook' | 'other'
): Promise<Project[]> {
  // 'other' category items don't link to projects
  if (itemCategory === 'other') {
    return await loadProjects();
  }

  const projects = await loadProjects();

  console.log('[sync] removeInventoryFromProjects:', { itemId, category: itemCategory });

  const field = itemCategory === 'yarn' ? 'yarnUsedIds' : 'hookUsedIds';

  let hasChanges = false;

  const updated = projects.map(project => {
    const currentIds: string[] = (project[field] as string[] | undefined) || [];
    if (currentIds.includes(itemId)) {
      hasChanges = true;
      const newIds = currentIds.filter(id => id !== itemId);
      return {
        ...project,
        [field]: newIds.length > 0 ? newIds : undefined,
        updatedAt: new Date(),
      };
    }
    return project;
  });

  if (hasChanges) {
    await saveProjects(updated);
    console.log('[sync] Cleaned up projects after inventory deletion');
  }

  return updated;
}
