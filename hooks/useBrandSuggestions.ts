/**
 * Yarn Brand Suggestions Hook (Legend-State Native)
 *
 * Provides autocomplete suggestions for yarn brand input.
 * - Extracts unique brands directly from the Inventory Store.
 * - No separate SQLite table needed.
 */

import { useCallback } from 'react';
import { useSelector } from '@legendapp/state/react';
import { useAuth } from './auth-context';
import { getStores } from '@/lib/legend-state/config';
import { InventoryItem } from '@/types';

export function useBrandSuggestions() {
  const { user, isPro } = useAuth();
  const { inventory$ } = getStores(user?.id ?? null, isPro);

  // 1. Reactive Brand List
  // We extract unique brand names from the inventory items currently in memory
  // This is O(N) but N is small (<500 items), so it's instant.
  const knownBrands = useSelector(() => {
    const itemsMap = inventory$.get();
    if (!itemsMap) return new Set<string>();

    const brands = new Set<string>();
    
    // Add built-in common brands
    brands.add('Red Heart');
    brands.add('Lion Brand');
    brands.add('Bernat');
    brands.add('Caron');
    brands.add('Lily Sugar\'n Cream');
    brands.add('Patons');
    brands.add('Premier Yarns');
    brands.add('Hobbii');
    brands.add('Scheepjes');
    brands.add('Malabrigo');

    Object.values(itemsMap).forEach((row: any) => {
      // Check yarnDetails.brand
      if (row.yarn_details) {
        try {
          const details = typeof row.yarn_details === 'string' 
            ? JSON.parse(row.yarn_details) 
            : row.yarn_details;
            
          if (details?.brand?.name) {
            brands.add(details.brand.name.trim());
          }
        } catch {}
      }
      
      // Check hookDetails.brand
      if (row.hook_details) {
        try {
          const details = typeof row.hook_details === 'string' 
            ? JSON.parse(row.hook_details) 
            : row.hook_details;
            
          if (details?.brand) {
            brands.add(details.brand.trim());
          }
        } catch {}
      }
    });

    return brands;
  });

  /**
   * Get brand suggestions matching a query
   */
  const getSuggestions = useCallback(
    async (query: string): Promise<string[]> => {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const normalizedQuery = query.toLowerCase().trim();
      
      return Array.from(knownBrands)
        .filter(brand => brand.toLowerCase().includes(normalizedQuery))
        .sort()
        .slice(0, 5);
    },
    [knownBrands]
  );

  /**
   * "Learn" a new brand
   * In the new architecture, we don't need to explicitly save brands to a separate table.
   * If the user saves an item with a new brand, it automatically becomes part of the
   * "knownBrands" set via the selector above.
   */
  const learnBrand = useCallback(async (brandName: string): Promise<void> => {
    // No-op: Data is derived from inventory usage
    console.log('[BrandSuggestions] Brand will be learned when item is saved:', brandName);
  }, []);

  /**
   * Sync brands (Deprecated)
   * Handled automatically by inventory sync
   */
  const syncBrands = useCallback(async (): Promise<void> => {
    // No-op
  }, []);

  /**
   * Get all brands
   */
  const getAllBrands = useCallback(async (): Promise<string[]> => {
    return Array.from(knownBrands).sort();
  }, [knownBrands]);

  return {
    getSuggestions,
    learnBrand,
    syncBrands,
    getAllBrands,
  };
}
