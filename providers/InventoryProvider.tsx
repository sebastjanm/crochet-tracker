/**
 * Inventory Context (Legend-State Native)
 *
 * ARCHITECTURE:
 * - Source of Truth: Legend-State Observable (inventory$)
 * - Persistence: AsyncStorage (handled by Legend-State)
 * - Sync: Supabase (handled by Legend-State)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useSelector } from '@legendapp/state/react';
import { InventoryItem } from '@/types';
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

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const { user, isPro } = useAuth();
  const { queueInventoryImages } = useImageSync();

  // State for Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InventoryItem['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('name');
  const { showImagePickerOptions, isPickingImage } = useImagePicker();

  // Get the reactive store
  const { inventory$ } = getStores(user?.id ?? null, isPro);

  // Auto-reconciliation: detect orphaned inventory items on app start
  // This catches edge cases where data was modified directly in Supabase
  useEffect(() => {
    if (!user?.id || !isPro) return;

    // Wait for initial sync to complete before reconciling
    const timer = setTimeout(async () => {
      const result = await reconcileInventory(user.id, inventory$);
      if (result.removed > 0 && __DEV__) {
        console.log(`[Inventory] Reconciliation removed ${result.removed} orphaned items`);
      }
    }, 2500); // 2.5s delay (slightly after projects)

    return () => clearTimeout(timer);
  }, [user?.id, isPro, inventory$]);

  // 2. Reactive Data Selector
  const items: InventoryItem[] = useSelector(() => {
    const itemsMap = inventory$.get();
    if (!itemsMap) return [] as InventoryItem[];

    return Object.values(itemsMap)
      // Soft delete: deleted_at is NULL for active, timestamp for deleted
      .filter((row: unknown) => {
        const r = row as { deleted_at?: string | null };
        return r.deleted_at === null || r.deleted_at === undefined;
      })
      // Trust the mapper - no double date conversion needed
      .map((row: unknown) => mapRowToInventoryItem(row as Parameters<typeof mapRowToInventoryItem>[0]))
      .sort((a: InventoryItem, b: InventoryItem) => b.updatedAt.getTime() - a.updatedAt.getTime());
  });

  const isLoading = false;

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

  /** Remove an image from an item */
  const removeImage = useCallback(async (itemId: string, imageIndex: number) => {
    const item = items.find((i: InventoryItem) => i.id === itemId);
    if (item && item.images) {
      const newImages = [...item.images];
      newImages.splice(imageIndex, 1);
      await updateItem(itemId, { images: newImages });
    }
  }, [items, updateItem]);

  /** Delete an inventory item (soft delete) */
  const deleteItem = useCallback(async (id: string) => {
    const itemToDelete = items.find((item: InventoryItem) => item.id === id);
    if (itemToDelete) {
      try {
        await removeInventoryFromProjects(id, itemToDelete.category);
      } catch (error) {
        if (__DEV__) console.error('[Inventory] Failed to clean up project references:', error);
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
    refreshItems: async () => {},
    replaceInventoryImage,
    yarnCount: statistics.yarnCount,
    hookCount: statistics.hookCount,
  };
});
