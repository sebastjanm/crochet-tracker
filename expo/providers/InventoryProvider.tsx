/**
 * Inventory Context (Legend-State Native)
 *
 * ARCHITECTURE:
 * - Source of Truth: Legend-State Observable (inventory$)
 * - Persistence: AsyncStorage (handled by Legend-State)
 * - Sync: Supabase (handled by Legend-State)
 *
 * OFFICIAL API USAGE (production-grade):
 * - syncState(obs$).isPersistLoaded - local persistence loaded
 * - syncState(obs$).isLoaded - remote sync complete
 * - syncState(obs$).clearPersist() - clear cache for full refresh
 * - syncState(obs$).sync() - force re-sync
 *
 * @see https://legendapp.com/open-source/state/v3/sync/persist-sync/
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useSelector } from '@legendapp/state/react';
import { syncState } from '@legendapp/state';
import { InventoryItem, ProjectImage } from '@/types';

// Helper to extract URL string from ProjectImage (which can be string | ImageSource)
function getImageUrlString(image: ProjectImage): string | undefined {
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image !== null && 'uri' in image && typeof image.uri === 'string') {
    return image.uri;
  }
  return undefined;
}
import { useImagePicker } from '@/hooks/useImagePicker';
import { syncInventoryToProjects, removeInventoryFromProjects } from '@/lib/cross-context-sync';
import {
  getStores,
  addInventoryItem as addItemToStore,
  updateInventoryItem as updateItemInStore,
  deleteInventoryItem as deleteItemFromStore,
  reconcileInventory,
} from '@/lib/legend-state/config';
import { useAuth } from '@/providers/AuthProvider';
import { useImageSync } from '@/hooks/useImageSync';
import {
  mapRowToInventoryItem,
  mapInventoryItemToRow,
} from '@/lib/legend-state/mappers';
import {
  deleteImage,
  extractPathFromUrl,
  isSupabaseStorageUrl,
} from '@/lib/supabase/storage';

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const { user, isPro } = useAuth();
  const { queueInventoryImages } = useImageSync();

  // State for Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InventoryItem['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('name');
  const { showImagePickerOptions, isPickingImage } = useImagePicker();

  // Refresh counter - increment to force store re-initialization
  const [refreshKey, setRefreshKey] = useState(0);

  // Get the reactive store (re-fetches when refreshKey changes or user/isPro changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { inventory$ } = useMemo(
    () => getStores(user?.id ?? null, isPro),
    [user?.id, isPro, refreshKey]
  );

  // Keep ref updated for use in refresh function
  const syncStateRef = useRef(syncState(inventory$));

  // Re-subscribe to sync state when inventory$ changes (after refresh)
  useEffect(() => {
    syncStateRef.current = syncState(inventory$);
  }, [inventory$]);

  // Use useSelector to derive loading state directly from observable
  // This avoids the infinite re-render loop caused by useState + useObserve
  const isLoading = useSelector(() => {
    const state = syncState(inventory$);
    const isPersistLoaded = state.isPersistLoaded?.get() ?? false;
    const isLoaded = state.isLoaded?.get() ?? false;
    return !isPersistLoaded || (isPro && !isLoaded);
  });

  // Sync complete when both persistence AND remote are loaded
  const isSyncComplete = useSelector(() => {
    const state = syncState(inventory$);
    const isPersistLoaded = state.isPersistLoaded?.get() ?? false;
    const isLoaded = state.isLoaded?.get() ?? false;
    return isPersistLoaded && isLoaded;
  });

  // Auto-reconciliation: detect orphaned inventory items after sync completes
  // This catches edge cases where data was modified directly in Supabase
  // Runs for ALL authenticated users (smart safety check protects never-synced users)
  useEffect(() => {
    if (!user?.id || !isSyncComplete) return; // Wait for sync to complete

    reconcileInventory(user.id, inventory$).then((result) => {
      if (result.removed > 0 && __DEV__) {
        console.log(`[Inventory] Reconciliation removed ${result.removed} orphaned items`);
      }
    });
  }, [user?.id, inventory$, isSyncComplete]);

  // 2. Reactive Data Selector
  const items: InventoryItem[] = useSelector(() => {
    const itemsMap = inventory$.get();
    if (!itemsMap) return [] as InventoryItem[];

    const allItems = Object.values(itemsMap);
    const activeItems = allItems.filter((row: unknown) => {
      const r = row as { deleted_at?: string | null };
      return r.deleted_at === null || r.deleted_at === undefined;
    });

    // DEBUG: Log item counts
    if (__DEV__) {
      console.log('[Inventory] Raw items in store:', allItems.length);
      console.log('[Inventory] Active items (not deleted):', activeItems.length);
    }

    return activeItems
      .map((row: unknown) => mapRowToInventoryItem(row as Parameters<typeof mapRowToInventoryItem>[0]))
      .sort((a: InventoryItem, b: InventoryItem) => b.updatedAt.getTime() - a.updatedAt.getTime());
  });

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  /** Add a new inventory item */
  const addItem = useCallback(async (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InventoryItem> => {
    const now = new Date();
    // 1. Map Domain -> Row
    const row = mapInventoryItemToRow({
      ...item,
      id: 'temp',
      createdAt: now,
      updatedAt: now,
    } as InventoryItem);

    // 2. Add to Store
    const id = addItemToStore(inventory$, user?.id ?? null, row);

    // 3. Build final InventoryItem
    const newItem: InventoryItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Queue Images
    if (item.images?.length) {
      queueInventoryImages(newItem);
    }

    return newItem;
  }, [inventory$, user?.id, queueInventoryImages]);

  /** Update an existing inventory item */
  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    const existingItem = items.find((i: InventoryItem) => i.id === id);
    if (!existingItem) {
      if (__DEV__) console.error(`[Inventory] Item ${id} not found`);
      return;
    }

    // Handle Project Sync
    if (updates.usedInProjects !== undefined) {
      try {
        await syncInventoryToProjects(
          id,
          existingItem.category,
          updates.usedInProjects ?? [],
          existingItem.usedInProjects ?? []
        );
      } catch (error) {
        if (__DEV__) console.error('[Inventory] Failed to sync projects:', error);
      }
    }

    // Handle removed images - delete from Supabase Storage
    if (updates.images !== undefined) {
      const oldUrls = (existingItem.images || []).map(getImageUrlString).filter(Boolean) as string[];
      const newUrls = (updates.images || []).map(getImageUrlString).filter(Boolean) as string[];

      // Find images that were removed
      const removedUrls = oldUrls.filter(url => !newUrls.includes(url));

      for (const imageUrl of removedUrls) {
        if (isSupabaseStorageUrl(imageUrl)) {
          const path = extractPathFromUrl(imageUrl, 'inventory-images');
          if (path) {
            const result = await deleteImage(path, 'inventory-images');
            if (__DEV__) {
              if (result.success) {
                console.log(`[Inventory] Deleted removed image from storage: ${path}`);
              } else {
                console.error(`[Inventory] Failed to delete image: ${result.error}`);
              }
            }
          }
        }
      }
    }

    const mergedItem: InventoryItem = { ...existingItem, ...updates, updatedAt: new Date() };
    const rowUpdates = mapInventoryItemToRow(mergedItem);

    updateItemInStore(inventory$, id, rowUpdates);

    if (updates.images) {
      queueInventoryImages(mergedItem);
    }

    if (__DEV__) console.log(`[Inventory] Updated item: ${id}`);
  }, [items, inventory$, queueInventoryImages]);

  /** Update item quantity by delta */
  const updateQuantity = useCallback(async (id: string, delta: number) => {
    const item = items.find((i: InventoryItem) => i.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + delta);
      await updateItem(id, { quantity: newQuantity });
    }
  }, [items, updateItem]);

  /** Mark item as used in a project */
  const markAsUsed = useCallback(async (id: string, projectId?: string) => {
    const item = items.find((i: InventoryItem) => i.id === id);
    if (item) {
      const usedInProjects = item.usedInProjects || [];
      if (projectId && !usedInProjects.includes(projectId)) {
        usedInProjects.push(projectId);
      }
      await updateItem(id, { usedInProjects });
    }
  }, [items, updateItem]);

  /** Add images to an item */
  const addImages = useCallback(async (itemId: string, newImages: string[]) => {
    const item = items.find((i: InventoryItem) => i.id === itemId);
    if (item) {
      await updateItem(itemId, {
        images: [...(item.images || []), ...newImages],
      });
    }
  }, [items, updateItem]);

  /** Remove an image from an item (also deletes from Supabase Storage) */
  const removeImage = useCallback(async (itemId: string, imageIndex: number) => {
    const item = items.find((i: InventoryItem) => i.id === itemId);
    if (item && item.images) {
      const imageUrl = getImageUrlString(item.images[imageIndex]);

      // Delete from Supabase Storage if it's a cloud URL
      if (imageUrl && isSupabaseStorageUrl(imageUrl)) {
        const path = extractPathFromUrl(imageUrl, 'inventory-images');
        if (path) {
          const result = await deleteImage(path, 'inventory-images');
          if (__DEV__) {
            if (result.success) {
              console.log(`[Inventory] Deleted image from storage: ${path}`);
            } else {
              console.error(`[Inventory] Failed to delete image: ${result.error}`);
            }
          }
        }
      }

      const newImages = [...item.images];
      newImages.splice(imageIndex, 1);
      await updateItem(itemId, { images: newImages });
    }
  }, [items, updateItem]);

  /** Delete an inventory item (soft delete + delete images from storage) */
  const deleteItem = useCallback(async (id: string) => {
    const itemToDelete = items.find((item: InventoryItem) => item.id === id);
    if (itemToDelete) {
      // Clean up project references
      try {
        await removeInventoryFromProjects(id, itemToDelete.category);
      } catch (error) {
        if (__DEV__) console.error('[Inventory] Failed to clean up project references:', error);
      }

      // Delete all images from Supabase Storage
      if (itemToDelete.images?.length) {
        for (const image of itemToDelete.images) {
          const imageUrl = getImageUrlString(image);
          if (imageUrl && isSupabaseStorageUrl(imageUrl)) {
            const path = extractPathFromUrl(imageUrl, 'inventory-images');
            if (path) {
              const result = await deleteImage(path, 'inventory-images');
              if (__DEV__) {
                if (result.success) {
                  console.log(`[Inventory] Deleted image from storage: ${path}`);
                } else {
                  console.error(`[Inventory] Failed to delete image: ${result.error}`);
                }
              }
            }
          }
        }
      }
    }
    deleteItemFromStore(inventory$, id);
    if (__DEV__) console.log(`[Inventory] Deleted item: ${id}`);
  }, [items, inventory$]);

  // Deprecated
  const replaceInventoryImage = useCallback(async (_itemId: string, _oldUri: string, _newUrl: string) => {
     // No-op
  }, []);

  /** Get item by ID */
  const getItemById = useCallback((id: string) => items.find((i: InventoryItem) => i.id === id), [items]);

  /** Get items by category */
  const getItemsByCategory = useCallback((category: InventoryItem['category']) => items.filter((i: InventoryItem) => i.category === category), [items]);

  /** Search items by query */
  const searchItems = useCallback((query: string): InventoryItem[] => {
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item: InventoryItem) =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.yarnDetails?.brand?.name?.toLowerCase().includes(lowerQuery) ||
        item.yarnDetails?.colorName?.toLowerCase().includes(lowerQuery) ||
        item.hookDetails?.brand?.toLowerCase().includes(lowerQuery)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item: InventoryItem) => item.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = searchItems(searchQuery);
    }
    filtered = [...filtered].sort((a: InventoryItem, b: InventoryItem) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'date': return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'quantity': return b.quantity - a.quantity;
        default: return 0;
      }
    });
    return filtered;
  }, [items, selectedCategory, searchQuery, sortBy, searchItems]);

  const statistics = useMemo(() => {
    const yarnItems = items.filter((i: InventoryItem) => i.category === 'yarn');
    const hookItems = items.filter((i: InventoryItem) => i.category === 'hook');
    const otherItems = items.filter((i: InventoryItem) => i.category === 'other');

    const totalValue = items.reduce((sum: number, item: InventoryItem) => {
      if (item.category === 'yarn' && item.yarnDetails?.purchasePrice) {
        return sum + item.yarnDetails.purchasePrice * item.quantity;
      }
      if (item.category === 'hook' && item.hookDetails?.purchasePrice) {
        return sum + item.hookDetails.purchasePrice * item.quantity;
      }
      return sum;
    }, 0);

    return {
      totalItems: items.length,
      totalValue,
      yarnCount: yarnItems.length,
      yarnSkeins: yarnItems.reduce((sum: number, item: InventoryItem) => sum + item.quantity, 0),
      hookCount: hookItems.length,
      otherCount: otherItems.length,
      uniqueBrands: new Set([
        ...yarnItems.map((i: InventoryItem) => i.yarnDetails?.brand?.name).filter(Boolean),
        ...hookItems.map((i: InventoryItem) => i.hookDetails?.brand).filter(Boolean),
      ]).size,
    };
  }, [items]);

  return {
    items,
    filteredItems,
    isLoading,
    searchQuery,
    selectedCategory,
    sortBy,
    statistics,
    addItem,
    updateItem,
    updateQuantity,
    deleteItem,
    markAsUsed,
    addImages,
    removeImage,
    getItemById,
    getItemsByCategory,
    searchItems,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    showImagePickerOptions,
    isPickingImage,
    // Sync local changes to cloud (does NOT clear local data)
    syncToCloud: async () => {
      if (__DEV__) console.log('[Inventory] Syncing to cloud...');
      try {
        const state = syncState(inventory$);
        await state.sync();
        if (__DEV__) console.log('[Inventory] Sync to cloud complete');
        return true;
      } catch (error) {
        if (__DEV__) console.error('[Inventory] Sync to cloud failed:', error);
        return false;
      }
    },
    // Force a full refresh from Supabase (CLEARS local data first!)
    // NOTE: Caller (profile.tsx) must clear AsyncStorage and store cache BEFORE calling this
    refreshItems: async () => {
      if (__DEV__) console.log('[Inventory] Triggering store re-creation via setRefreshKey...');
      // Increment refreshKey to trigger useMemo re-execution and new store creation
      setRefreshKey(prev => prev + 1);
      return true;
    },
    replaceInventoryImage,
    yarnCount: statistics.yarnCount,
    hookCount: statistics.hookCount,
  };
});
