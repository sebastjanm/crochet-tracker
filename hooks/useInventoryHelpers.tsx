import { useMemo } from 'react';
import { useInventory } from '@/providers/InventoryProvider';
import { InventoryItem } from '@/types';

export function useYarnInventory() {
  const { items, addItem, updateItem } = useInventory();
  
  const yarnItems = useMemo(() => 
    items.filter(item => item.category === 'yarn'),
    [items]
  );
  
  const yarnByBrand = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    yarnItems.forEach(item => {
      const brand = item.yarnDetails?.brand?.name || 'Unknown';
      if (!grouped[brand]) grouped[brand] = [];
      grouped[brand].push(item);
    });
    return grouped;
  }, [yarnItems]);
  
  const yarnByWeight = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    yarnItems.forEach(item => {
      const weight = item.yarnDetails?.weight?.name || 'Unknown';
      if (!grouped[weight]) grouped[weight] = [];
      grouped[weight].push(item);
    });
    return grouped;
  }, [yarnItems]);

  const totalYarnLength = useMemo(() =>
    yarnItems.reduce((sum, item) =>
      sum + (item.yarnDetails?.meters || 0) * item.quantity, 0
    ),
    [yarnItems]
  );

  const totalYarnWeight = useMemo(() =>
    yarnItems.reduce((sum, item) =>
      sum + (item.yarnDetails?.grams || 0) * item.quantity, 0
    ),
    [yarnItems]
  );
  
  return {
    yarnItems,
    yarnByBrand,
    yarnByWeight,
    totalYarnLength,
    totalYarnWeight,
    yarnCount: yarnItems.length,
    totalSkeins: yarnItems.reduce((sum, item) => sum + item.quantity, 0)
  };
}

export function useHookInventory() {
  const { items } = useInventory();
  
  const hookItems = useMemo(() => 
    items.filter(item => item.category === 'hook'),
    [items]
  );
  
  const hooksBySize = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    hookItems.forEach(item => {
      const size = item.hookDetails?.sizeMm?.toString() || 'Unknown';
      if (!grouped[size]) grouped[size] = [];
      grouped[size].push(item);
    });
    return grouped;
  }, [hookItems]);
  
  const availableSizes = useMemo(() => {
    const sizes = new Set<number>();
    hookItems.forEach(item => {
      if (item.hookDetails?.sizeMm) {
        sizes.add(item.hookDetails.sizeMm);
      }
    });
    return Array.from(sizes).sort((a, b) => a - b);
  }, [hookItems]);
  
  const ergonomicHooks = useMemo(() => 
    hookItems.filter(item => item.hookDetails?.handleType === 'ergonomic'),
    [hookItems]
  );
  
  return {
    hookItems,
    hooksBySize,
    availableSizes,
    ergonomicHooks,
    hookCount: hookItems.length
  };
}

export function useInventorySearch() {
  const { searchQuery, setSearchQuery, filteredItems } = useInventory();
  
  const recentSearches = useMemo(() => {
    // This could be persisted in AsyncStorage if needed
    return [];
  }, []);
  
  const suggestedCategories = useMemo(() => {
    const categories = new Set<string>();
    filteredItems.forEach(item => {
      categories.add(item.category);
    });
    return Array.from(categories);
  }, [filteredItems]);
  
  return {
    searchQuery,
    setSearchQuery,
    results: filteredItems,
    resultCount: filteredItems.length,
    recentSearches,
    suggestedCategories
  };
}

export function useInventoryStats() {
  const { statistics } = useInventory();

  const mostUsedItems = useMemo(() => {
    // This would need lastUsed tracking to be more accurate
    return [];
  }, []);

  return {
    ...statistics,
    mostUsedItems
  };
}