import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo } from 'react';
import { InventoryItem } from '@/types';
import { useImagePicker } from './useImagePicker';

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
      description: upcData?.description || additionalData.description || '',
      images: upcData?.images || additionalData.images || [],
      quantity: additionalData.quantity || 1,
      category,
      barcode,
      upcData,
      // Set category-specific name
      ...(category === 'yarn' && { yarnDetails: { name: itemName } }),
      ...(category === 'hook' && { hookDetails: { name: itemName, size: '' } }),
      ...(category === 'other' && { otherDetails: { name: itemName } }),
      ...additionalData
    } as Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>);
    
    return newItem;
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
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
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    await saveInventory(updated);
  };

  const getItemsByCategory = (category: InventoryItem['category']) => {
    return items.filter(item => item.category === category);
  };

  const getLowStockItems = () => {
    return items.filter(item => 
      item.minQuantity && item.quantity <= item.minQuantity
    );
  };

  const getItemByBarcode = (barcode: string) => {
    return items.find(item => item.barcode === barcode);
  };

  const searchItems = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.yarnDetails?.name?.toLowerCase().includes(lowerQuery) ||
      item.yarnDetails?.brand?.toLowerCase().includes(lowerQuery) ||
      item.yarnDetails?.color?.toLowerCase().includes(lowerQuery) ||
      item.hookDetails?.name?.toLowerCase().includes(lowerQuery) ||
      item.hookDetails?.brand?.toLowerCase().includes(lowerQuery) ||
      item.otherDetails?.name?.toLowerCase().includes(lowerQuery) ||
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
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        item.yarnDetails?.name?.toLowerCase().includes(lowerQuery) ||
        item.yarnDetails?.brand?.toLowerCase().includes(lowerQuery) ||
        item.yarnDetails?.color?.toLowerCase().includes(lowerQuery) ||
        item.hookDetails?.name?.toLowerCase().includes(lowerQuery) ||
        item.hookDetails?.brand?.toLowerCase().includes(lowerQuery) ||
        item.otherDetails?.name?.toLowerCase().includes(lowerQuery) ||
        item.barcode?.includes(searchQuery)
      );
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          // Get display name for sorting based on category
          const aName = a.category === 'yarn'
            ? (a.yarnDetails?.name || '')
            : a.category === 'hook'
            ? (a.hookDetails?.name || '')
            : (a.otherDetails?.name || '');
          const bName = b.category === 'yarn'
            ? (b.yarnDetails?.name || '')
            : b.category === 'hook'
            ? (b.hookDetails?.name || '')
            : (b.otherDetails?.name || '');
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
      if (item.category === 'yarn' && item.yarnDetails?.purchase_price) {
        return sum + (item.yarnDetails.purchase_price * item.quantity);
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
      lowStockCount: getLowStockItems().length,
      uniqueBrands: new Set([
        ...yarnItems.map(i => i.yarnDetails?.brand).filter(Boolean),
        ...hookItems.map(i => i.hookDetails?.brand).filter(Boolean)
      ]).size
    };
  }, [items]);

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
    getItemsByCategory,
    getLowStockItems,
    getItemByBarcode,
    searchItems,
    
    // Filters
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    
    // Image picker
    showImagePickerOptions,
    isPickingImage,
    
    // Legacy (for backward compatibility)
    yarnCount: statistics.yarnCount,
    hookCount: statistics.hookCount,
  };
});