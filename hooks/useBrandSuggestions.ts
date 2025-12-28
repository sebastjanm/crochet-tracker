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
import type { InventoryItem } from '@/types';

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

    (Object.values(itemsMap) as InventoryItem[]).forEach((row) => {
      // Check yarnDetails.brand (snake_case from DB, camelCase in types)
      const yarnDetails = (row as unknown as Record<string, unknown>).yarn_details ?? row.yarnDetails;
      if (yarnDetails) {
        try {
          const details = typeof yarnDetails === 'string'
            ? JSON.parse(yarnDetails)
            : yarnDetails;

          if (details?.brand?.name) {
            brands.add(details.brand.name.trim());
          }
        } catch (error) {
          if (__DEV__) console.warn('[BrandSuggestions] Failed to parse yarn details:', error);
        }
      }

      // Check hookDetails.brand (snake_case from DB, camelCase in types)
      const hookDetails = (row as unknown as Record<string, unknown>).hook_details ?? row.hookDetails;
      if (hookDetails) {
        try {
          const details = typeof hookDetails === 'string'
            ? JSON.parse(hookDetails)
            : hookDetails;

          if (details?.brand) {
            brands.add(details.brand.trim());
          }
        } catch (error) {
          if (__DEV__) console.warn('[BrandSuggestions] Failed to parse hook details:', error);
        }
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
    if (__DEV__) console.log('[BrandSuggestions] Brand will be learned when item is saved:', brandName);
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
