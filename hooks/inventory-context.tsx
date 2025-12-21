import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo } from 'react';
import { InventoryItem } from '@/types';
import { useImagePicker } from './useImagePicker';
import { syncInventoryToProjects, removeInventoryFromProjects } from '@/lib/sync';

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InventoryItem['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('name');
  const { showImagePickerOptions, isPickingImage } = useImagePicker();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await AsyncStorage.getItem('inventory');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setItems(parsed.map((item: any) => ({
            ...item,
            dateAdded: new Date(item.dateAdded),
            lastUpdated: new Date(item.lastUpdated),
            lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined,
            // Convert nested dates in category details
            yarnDetails: item.yarnDetails ? {
              ...item.yarnDetails,
              purchaseDate: item.yarnDetails.purchaseDate ? new Date(item.yarnDetails.purchaseDate) : undefined,
            } : undefined,
            hookDetails: item.hookDetails ? {
              ...item.hookDetails,
              purchaseDate: item.hookDetails.purchaseDate ? new Date(item.hookDetails.purchaseDate) : undefined,
            } : undefined,
          })));
        } catch (parseError) {
          console.error('Failed to parse inventory data, resetting:', parseError);
          // Clear corrupted data and start fresh
          await AsyncStorage.removeItem('inventory');
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveInventory = async (updatedItems: InventoryItem[]) => {
    try {
      await AsyncStorage.setItem('inventory', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Failed to save inventory:', error);
    }
  };

  const addItem = async (item: Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>) => {
    const now = new Date();
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      dateAdded: now,
      lastUpdated: now,
    };
    
    const updated = [...items, newItem];
    setItems(updated);
    await saveInventory(updated);
    return newItem;
  };

  const addItemWithBarcode = async (
    barcode: string, 
    upcData: InventoryItem['upcData'],
    additionalData: Partial<InventoryItem>
  ) => {
    const existingItem = items.find(item => item.barcode === barcode);
    
    if (existingItem) {
      // If item with same barcode exists, just update quantity
      await updateItem(existingItem.id, {
        quantity: existingItem.quantity + (additionalData.quantity || 1),
        lastUpdated: new Date()
      });
      return existingItem;
    }
    
    // Create new item with barcode data
    const category = additionalData.category || 'other';
    const itemName = upcData?.title || 'Unknown Item';

    const newItem = await addItem({
      name: itemName,
      description: upcData?.description || additionalData.description || '',
      images: upcData?.images || additionalData.images || [],
      quantity: additionalData.quantity || 1,
      category,
      barcode,
      upcData,
      ...additionalData
    } as Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>);
    
    return newItem;
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const existingItem = items.find(item => item.id === id);

    // Sync projects if usedInProjects changed
    if (existingItem && updates.usedInProjects !== undefined) {
      try {
        await syncInventoryToProjects(
          id,
          existingItem.category,
          updates.usedInProjects ?? [],
          existingItem.usedInProjects ?? []
        );
        console.log('✅ Projects synced with inventory item changes');
      } catch (error) {
        console.error('❌ Failed to sync projects:', error);
        // Continue with inventory update even if sync fails
      }
    }

    const updated = items.map(item =>
      item.id === id ? { ...item, ...updates, lastUpdated: new Date() } : item
    );
    setItems(updated);
    await saveInventory(updated);
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + delta);
      await updateItem(id, { quantity: newQuantity });
    }
  };

  const markAsUsed = async (id: string, projectId?: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const usedInProjects = item.usedInProjects || [];
      if (projectId && !usedInProjects.includes(projectId)) {
        usedInProjects.push(projectId);
      }
      await updateItem(id, { 
        lastUsed: new Date(),
        usedInProjects
      });
    }
  };

  const addImages = async (itemId: string, newImages: string[]) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      await updateItem(itemId, {
        images: [...(item.images || []), ...newImages]
      });
    }
  };

  const removeImage = async (itemId: string, imageIndex: number) => {
    const item = items.find(i => i.id === itemId);
    if (item && item.images) {
      const newImages = [...item.images];
      newImages.splice(imageIndex, 1);
      await updateItem(itemId, { images: newImages });
    }
  };

  const deleteItem = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);

    // Clean up project references if this item is linked to projects
    if (itemToDelete) {
      try {
        await removeInventoryFromProjects(id, itemToDelete.category);
        console.log('✅ Projects cleaned up after inventory deletion');
      } catch (error) {
        console.error('❌ Failed to clean up project references:', error);
        // Continue with deletion even if cleanup fails
      }
    }

    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    await saveInventory(updated);
  };

  const getItemById = (id: string) => {
    return items.find(item => item.id === id);
  };

  const getItemsByCategory = (category: InventoryItem['category']) => {
    return items.filter(item => item.category === category);
  };

  const getItemByBarcode = (barcode: string) => {
    return items.find(item => item.barcode === barcode);
  };

  const searchItems = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.yarnDetails?.brand?.toLowerCase().includes(lowerQuery) ||
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
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        item.yarnDetails?.brand?.toLowerCase().includes(lowerQuery) ||
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
    const yarnItems = items.filter(i => i.category === 'yarn');
    const hookItems = items.filter(i => i.category === 'hook');
    const otherItems = items.filter(i => i.category === 'other');

    // Calculate total value from yarn and hook purchase prices
    const totalValue = items.reduce((sum, item) => {
      if (item.category === 'yarn' && item.yarnDetails?.purchasePrice) {
        return sum + (item.yarnDetails.purchasePrice * item.quantity);
      }
      if (item.category === 'hook' && item.hookDetails?.purchasePrice) {
        return sum + (item.hookDetails.purchasePrice * item.quantity);
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
        ...yarnItems.map(i => i.yarnDetails?.brand).filter(Boolean),
        ...hookItems.map(i => i.hookDetails?.brand).filter(Boolean)
      ]).size
    };
  }, [items]);

  // Refresh items from AsyncStorage (for cross-context sync)
  const refreshItems = async () => {
    await loadInventory();
    console.log('🔄 Inventory refreshed from AsyncStorage');
  };

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

    // Legacy (for backward compatibility)
    yarnCount: statistics.yarnCount,
    hookCount: statistics.hookCount,
  };
});