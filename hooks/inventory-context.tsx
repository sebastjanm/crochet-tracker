/**
 * Inventory Context with SQLite Storage
 *
 * Provides inventory item CRUD operations with offline-first SQLite persistence.
 * Uses useSQLiteContext from expo-sqlite for database access.
 * Pro users get automatic cloud sync via Supabase.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/sqlite/
 */

import createContextHook from '@nkzw/create-context-hook';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { InventoryItem } from '@/types';
import { useImagePicker } from './useImagePicker';
import { syncInventoryToProjects, removeInventoryFromProjects } from '@/lib/cross-context-sync';
import { getStores, deleteInventoryItem as deleteLegendInventory } from '@/lib/legend-state/config';
import { mapLocalInventoryToCloud, replaceImageUri } from '@/lib/legend-state/type-mappers';
import { useAuth } from '@/hooks/auth-context';
import {
  InventoryItemRow,
  mapRowToInventoryItem,
  mapInventoryItemToRow,
  generateId,
  now,
} from '@/lib/database/schema';

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const db = useSQLiteContext();
  const { user, isPro } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InventoryItem['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('name');
  const { showImagePickerOptions, isPickingImage } = useImagePicker();

  // Legend-State stores reference for Pro users
  const storesRef = useRef<{ inventory$: ReturnType<typeof getStores>['inventory$'] } | null>(null);

  // Initialize Legend-State stores for Pro users
  useEffect(() => {
    if (isPro && user?.id) {
      const stores = getStores(user.id);
      storesRef.current = { inventory$: stores.inventory$ };
      console.log('[Inventory] Legend-State stores initialized for Pro user');
    } else {
      storesRef.current = null;
    }
  }, [isPro, user?.id]);

  /**
   * Push inventory item to cloud via Legend-State (Pro users only).
   * SQLite remains the source of truth - this syncs to cloud.
   */
  const pushToCloud = useCallback((item: InventoryItem) => {
    if (!isPro || !user?.id) {
      console.log('[Inventory] Skipping cloud push - not Pro or no user');
      return;
    }

    const inventory$ = storesRef.current?.inventory$;
    if (!inventory$) {
      console.warn('[Inventory] Legend-State stores not initialized');
      return;
    }

    try {
      // Convert local item to cloud format and push to Legend-State
      const cloudItem = mapLocalInventoryToCloud(item, user.id);

      // Write to Legend-State observable (auto-syncs to Supabase)
      inventory$[item.id].assign(cloudItem);

      console.log('[Inventory] Pushed to cloud via Legend-State:', item.id);
    } catch (error) {
      console.error('[Inventory] Failed to push to cloud:', error);
      // SQLite still has the data - cloud sync will retry
    }
  }, [isPro, user?.id]);

  /**
   * Load all inventory items from SQLite database.
   */
  const loadInventory = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<InventoryItemRow>(
        'SELECT * FROM inventory_items ORDER BY last_updated DESC'
      );

      const loadedItems = rows.map((row) => {
        const item = mapRowToInventoryItem(row);

        // Ensure dates are properly converted
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
      });

      setItems(loadedItems);
      console.log(`[Inventory] Loaded ${loadedItems.length} items from SQLite`);
    } catch (error) {
      console.error('[Inventory] Failed to load items:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  /**
   * Add a new inventory item to the database.
   */
  const addItem = async (
    item: Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>
  ): Promise<InventoryItem> => {
    const id = generateId();
    const timestamp = now();
    const row = mapInventoryItemToRow(item);

    await db.runAsync(
      `INSERT INTO inventory_items (
        id, category, name, description, images, quantity, unit,
        yarn_details, hook_details, other_details, location, tags,
        used_in_projects, notes, barcode, date_added, last_updated, pending_sync, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        row.category,
        row.name,
        row.description,
        row.images,
        row.quantity,
        row.unit,
        row.yarn_details,
        row.hook_details,
        row.other_details,
        row.location,
        row.tags,
        row.used_in_projects,
        row.notes,
        row.barcode,
        timestamp,
        timestamp,
        1, // pending_sync = true
        user?.id ?? null, // Associate with current user
      ]
    );

    const newItem: InventoryItem = {
      ...item,
      id,
      dateAdded: new Date(timestamp),
      lastUpdated: new Date(timestamp),
    };

    setItems((prev) => [newItem, ...prev]);
    console.log(`[Inventory] Added item: ${newItem.name}`);

    // Push to cloud via Legend-State (Pro users only)
    pushToCloud(newItem);

    return newItem;
  };

  /**
   * Add an item with barcode, updating quantity if it already exists.
   */
  const addItemWithBarcode = async (
    barcode: string,
    additionalData: Partial<InventoryItem>
  ): Promise<InventoryItem> => {
    const existingItem = items.find((item) => item.barcode === barcode);

    if (existingItem) {
      // If item with same barcode exists, just update quantity
      await updateItem(existingItem.id, {
        quantity: existingItem.quantity + (additionalData.quantity || 1),
      });
      return existingItem;
    }

    // Create new item with barcode data
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

  /**
   * Update an existing inventory item.
   */
  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const existingItem = items.find((item) => item.id === id);
    if (!existingItem) {
      console.error(`[Inventory] Item ${id} not found`);
      return;
    }

    // Sync projects if usedInProjects changed
    if (updates.usedInProjects !== undefined) {
      try {
        await syncInventoryToProjects(
          id,
          existingItem.category,
          updates.usedInProjects ?? [],
          existingItem.usedInProjects ?? []
        );
        console.log('[Inventory] Projects synced with inventory changes');
      } catch (error) {
        console.error('[Inventory] Failed to sync projects:', error);
        // Continue with update even if sync fails
      }
    }

    const updatedItem: InventoryItem = {
      ...existingItem,
      ...updates,
      lastUpdated: new Date(),
    };

    // Optimistic update
    setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));

    const row = mapInventoryItemToRow(updatedItem);
    const timestamp = now();

    try {
      await db.runAsync(
        `UPDATE inventory_items SET
          category = ?, name = ?, description = ?, images = ?, quantity = ?,
          unit = ?, yarn_details = ?, hook_details = ?, other_details = ?,
          location = ?, tags = ?, used_in_projects = ?, notes = ?, barcode = ?,
          last_updated = ?, pending_sync = ?
        WHERE id = ?`,
        [
          row.category,
          row.name,
          row.description,
          row.images,
          row.quantity,
          row.unit,
          row.yarn_details,
          row.hook_details,
          row.other_details,
          row.location,
          row.tags,
          row.used_in_projects,
          row.notes,
          row.barcode,
          timestamp,
          1, // pending_sync = true
          id,
        ]
      );

      console.log(`[Inventory] Updated item: ${id}`);

      // Push to cloud via Legend-State (Pro users only)
      pushToCloud(updatedItem);
    } catch (error) {
      console.error(`[Inventory] Failed to update item ${id}:`, error);
      setItems((prev) => prev.map((item) => (item.id === id ? existingItem : item)));
      throw error;
    }
  };

  /**
   * Update item quantity by delta.
   */
  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + delta);
      await updateItem(id, { quantity: newQuantity });
    }
  };

  /**
   * Mark an item as used in a project.
   */
  const markAsUsed = async (id: string, projectId?: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      const usedInProjects = item.usedInProjects || [];
      if (projectId && !usedInProjects.includes(projectId)) {
        usedInProjects.push(projectId);
      }
      await updateItem(id, { usedInProjects });
    }
  };

  /**
   * Add images to an item.
   */
  const addImages = async (itemId: string, newImages: string[]) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      await updateItem(itemId, {
        images: [...(item.images || []), ...newImages],
      });
    }
  };

  /**
   * Remove an image from an item.
   */
  const removeImage = async (itemId: string, imageIndex: number) => {
    const item = items.find((i) => i.id === itemId);
    if (item && item.images) {
      const newImages = [...item.images];
      newImages.splice(imageIndex, 1);
      await updateItem(itemId, { images: newImages });
    }
  };

  /**
   * Delete an inventory item.
   */
  const deleteItem = async (id: string) => {
    const itemToDelete = items.find((item) => item.id === id);

    // Clean up project references if this item is linked to projects
    if (itemToDelete) {
      try {
        await removeInventoryFromProjects(id, itemToDelete.category);
        console.log('[Inventory] Projects cleaned up after deletion');
      } catch (error) {
        console.error('[Inventory] Failed to clean up project references:', error);
        // Continue with deletion even if cleanup fails
      }
    }

    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await db.runAsync('DELETE FROM inventory_items WHERE id = ?', [id]);
      console.log(`[Inventory] Deleted item: ${id}`);

      // Soft delete in cloud via Legend-State (Pro users only)
      if (isPro && user?.id && storesRef.current?.inventory$) {
        try {
          deleteLegendInventory(storesRef.current.inventory$, id);
          console.log(`[Inventory] Soft deleted in cloud via Legend-State: ${id}`);
        } catch (error) {
          console.error('[Inventory] Failed to soft delete in cloud:', error);
          // Local deletion succeeded - cloud sync will catch up
        }
      }
    } catch (error) {
      console.error(`[Inventory] Failed to delete item ${id}:`, error);
      await loadInventory();
      throw error;
    }
  };

  /**
   * Get an item by ID.
   */
  const getItemById = (id: string): InventoryItem | undefined => {
    return items.find((item) => item.id === id);
  };

  /**
   * Get all items by category.
   */
  const getItemsByCategory = (category: InventoryItem['category']): InventoryItem[] => {
    return items.filter((item) => item.category === category);
  };

  /**
   * Get an item by barcode.
   */
  const getItemByBarcode = (barcode: string): InventoryItem | undefined => {
    return items.find((item) => item.barcode === barcode);
  };

  /**
   * Search items by query.
   */
  const searchItems = (query: string): InventoryItem[] => {
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.yarnDetails?.brand?.name?.toLowerCase().includes(lowerQuery) ||
        item.yarnDetails?.colorName?.toLowerCase().includes(lowerQuery) ||
        item.hookDetails?.brand?.toLowerCase().includes(lowerQuery) ||
        item.barcode?.includes(query)
    );
  };

  // Filtered and sorted items based on current filters
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.yarnDetails?.brand?.name?.toLowerCase().includes(lowerQuery) ||
          item.yarnDetails?.colorName?.toLowerCase().includes(lowerQuery) ||
          item.hookDetails?.brand?.toLowerCase().includes(lowerQuery) ||
          item.barcode?.includes(searchQuery)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const aName = a.name || '';
          const bName = b.name || '';
          return aName.localeCompare(bName);
        case 'date':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'quantity':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, selectedCategory, searchQuery, sortBy]);

  // Statistics
  const statistics = useMemo(() => {
    const yarnItems = items.filter((i) => i.category === 'yarn');
    const hookItems = items.filter((i) => i.category === 'hook');
    const otherItems = items.filter((i) => i.category === 'other');

    // Calculate total value from yarn and hook purchase prices
    const totalValue = items.reduce((sum, item) => {
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
      yarnSkeins: yarnItems.reduce((sum, item) => sum + item.quantity, 0),
      hookCount: hookItems.length,
      otherCount: otherItems.length,
      uniqueBrands: new Set([
        ...yarnItems.map((i) => i.yarnDetails?.brand?.name).filter(Boolean),
        ...hookItems.map((i) => i.hookDetails?.brand).filter(Boolean),
      ]).size,
    };
  }, [items]);

  /**
   * Refresh items from database.
   */
  const refreshItems = async () => {
    await loadInventory();
    console.log('[Inventory] Refreshed from SQLite');
  };

  /**
   * Replace a local image URI with a cloud URL after upload.
   * Called by the image sync queue when an upload completes.
   */
  const replaceInventoryImage = useCallback(async (
    itemId: string,
    oldUri: string,
    newUrl: string
  ): Promise<void> => {
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      console.warn(`[Inventory] replaceInventoryImage: Item ${itemId} not found`);
      return;
    }

    const images = item.images || [];
    const updatedImages = replaceImageUri(images, oldUri, newUrl);

    // Check if any replacement was made
    if (JSON.stringify(images) === JSON.stringify(updatedImages)) {
      console.warn(`[Inventory] replaceInventoryImage: URI ${oldUri} not found in item ${itemId}`);
      return;
    }

    // Update via existing updateItem to ensure SQLite and cloud sync
    await updateItem(itemId, { images: updatedImages });
    console.log(`[Inventory] Replaced image URI in item ${itemId}: ${oldUri} → ${newUrl}`);
  }, [items, updateItem]);

  return {
    // State
    items,
    filteredItems,
    isLoading,
    searchQuery,
    selectedCategory,
    sortBy,
    statistics,

    // Actions
    addItem,
    addItemWithBarcode,
    updateItem,
    updateQuantity,
    deleteItem,
    markAsUsed,
    addImages,
    removeImage,

    // Queries
    getItemById,
    getItemsByCategory,
    getItemByBarcode,
    searchItems,

    // Filters
    setSearchQuery,
    setSelectedCategory,
    setSortBy,

    // Image picker
    showImagePickerOptions,
    isPickingImage,

    // Cross-context sync
    refreshItems,
    replaceInventoryImage,

    // Legacy (for backward compatibility)
    yarnCount: statistics.yarnCount,
    hookCount: statistics.hookCount,
  };
});
