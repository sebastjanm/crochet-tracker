/**
 * Inventory Context (Legend-State Native)
 *
 * ARCHITECTURE:
 * - Source of Truth: Legend-State Observable (inventory$)
 * - Persistence: AsyncStorage (handled by Legend-State)
 * - Sync: Supabase (handled by Legend-State)
 */

import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo } from 'react';
import { useSelector } from '@legendapp/state/react';
import { InventoryItem } from '@/types';
import { useImagePicker } from './useImagePicker';
import { syncInventoryToProjects, removeInventoryFromProjects } from '@/lib/cross-context-sync';
import {
  getStores,
  addInventoryItem as addItemToStore,
  updateInventoryItem as updateItemInStore,
  deleteInventoryItem as deleteItemFromStore,
} from '@/lib/legend-state/config';
import { useAuth } from '@/hooks/auth-context';
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

  // 2. Reactive Data Selector
  const items: InventoryItem[] = useSelector(() => {
    const itemsMap = inventory$.get();
    if (!itemsMap) return [] as InventoryItem[];

    return Object.values(itemsMap)
      .filter((row: any) => !row.deleted)
      .map((row: any): InventoryItem => {
         const item = mapRowToInventoryItem(row);
         return {
           ...item,
           yarnDetails: item.yarnDetails
             ? {
                 ...item.yarnDetails,
                 purchaseDate: item.yarnDetails.purchaseDate
                   ? new Date(item.yarnDetails.purchaseDate)
                   : undefined,
               }
             : undefined,
           hookDetails: item.hookDetails
             ? {
                 ...item.hookDetails,
                 purchaseDate: item.hookDetails.purchaseDate
                   ? new Date(item.hookDetails.purchaseDate)
                   : undefined,
               }
             : undefined,
         };
      })
      .sort((a: InventoryItem, b: InventoryItem) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  });

  const isLoading = false;

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const addItem = async (
    item: Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>
  ): Promise<InventoryItem> => {
    // 1. Map Domain -> Row
    const row = mapInventoryItemToRow({
      ...item,
      id: 'temp',
      dateAdded: new Date(),
      lastUpdated: new Date()
    } as InventoryItem);
    
    // 2. Add to Store
    const id = addItemToStore(inventory$, user?.id ?? null, row);
    
    // 3. Queue Images
    if (item.images?.length) {
      queueInventoryImages({ ...row, id });
    }

    return {
      ...item,
      id,
      dateAdded: new Date(),
      lastUpdated: new Date(),
    };
  };

  const addItemWithBarcode = async (
    barcode: string,
    additionalData: Partial<InventoryItem>
  ): Promise<InventoryItem> => {
    const existingItem = items.find((item: InventoryItem) => item.barcode === barcode);

    if (existingItem) {
      const newQuantity = existingItem.quantity + (additionalData.quantity || 1);
      await updateItem(existingItem.id, { quantity: newQuantity });
      return { ...existingItem, quantity: newQuantity };
    }

    const category = additionalData.category || 'other';
    const itemName = additionalData.name || 'Unknown Item';

    return addItem({
      name: itemName,
      description: additionalData.description,
      images: additionalData.images || [],
      quantity: additionalData.quantity || 1,
      category,
      barcode,
      ...additionalData,
    } as Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>);
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const existingItem = items.find((i: InventoryItem) => i.id === id);
    if (!existingItem) {
      console.error(`[Inventory] Item ${id} not found`);
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
        console.error('[Inventory] Failed to sync projects:', error);
      }
    }

    const mergedItem = { ...existingItem, ...updates };
    const rowUpdates = mapInventoryItemToRow(mergedItem);

    updateItemInStore(inventory$, id, rowUpdates);

    if (updates.images) {
      queueInventoryImages({ ...rowUpdates, id });
    }

    console.log(`[Inventory] Updated item: ${id}`);
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find((i: InventoryItem) => i.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + delta);
      await updateItem(id, { quantity: newQuantity });
    }
  };

  const markAsUsed = async (id: string, projectId?: string) => {
    const item = items.find((i: InventoryItem) => i.id === id);
    if (item) {
      const usedInProjects = item.usedInProjects || [];
      if (projectId && !usedInProjects.includes(projectId)) {
        usedInProjects.push(projectId);
      }
      await updateItem(id, { usedInProjects });
    }
  };

  const addImages = async (itemId: string, newImages: string[]) => {
    const item = items.find((i: InventoryItem) => i.id === itemId);
    if (item) {
      await updateItem(itemId, {
        images: [...(item.images || []), ...newImages],
      });
    }
  };

  const removeImage = async (itemId: string, imageIndex: number) => {
    const item = items.find((i: InventoryItem) => i.id === itemId);
    if (item && item.images) {
      const newImages = [...item.images];
      newImages.splice(imageIndex, 1);
      await updateItem(itemId, { images: newImages });
    }
  };

  const deleteItem = async (id: string) => {
    const itemToDelete = items.find((item: InventoryItem) => item.id === id);
    if (itemToDelete) {
      try {
        await removeInventoryFromProjects(id, itemToDelete.category);
      } catch (error) {
        console.error('[Inventory] Failed to clean up project references:', error);
      }
    }
    deleteItemFromStore(inventory$, id);
    console.log(`[Inventory] Deleted item: ${id}`);
  };

  // Deprecated
  const replaceInventoryImage = async (itemId: string, oldUri: string, newUrl: string) => {
     // No-op
  };

  const getItemById = (id: string) => items.find((i: InventoryItem) => i.id === id);
  const getItemsByCategory = (category: InventoryItem['category']) => items.filter((i: InventoryItem) => i.category === category);
  const getItemByBarcode = (barcode: string) => items.find((i: InventoryItem) => i.barcode === barcode);
  
  const searchItems = (query: string): InventoryItem[] => {
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item: InventoryItem) =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.yarnDetails?.brand?.name?.toLowerCase().includes(lowerQuery) ||
        item.yarnDetails?.colorName?.toLowerCase().includes(lowerQuery) ||
        item.hookDetails?.brand?.toLowerCase().includes(lowerQuery) ||
        item.barcode?.includes(query)
    );
  };

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
        case 'date': return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'quantity': return b.quantity - a.quantity;
        default: return 0;
      }
    });
    return filtered;
  }, [items, selectedCategory, searchQuery, sortBy]);

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
    addItemWithBarcode,
    updateItem,
    updateQuantity,
    deleteItem,
    markAsUsed,
    addImages,
    removeImage,
    getItemById,
    getItemsByCategory,
    getItemByBarcode,
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
