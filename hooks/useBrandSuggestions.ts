/**
 * Yarn Brand Suggestions Hook
 *
 * Provides autocomplete suggestions for yarn brand input.
 * - Learns new brands from user input
 * - Searches SQLite for matching brands
 * - Syncs with Supabase for Pro users
 */

import { useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useAuth } from './auth-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { YarnBrand as SupabaseYarnBrand, YarnBrandInsert } from '@/lib/supabase/database.types';

// Local SQLite brand type (user_id can be null for seed data)
interface YarnBrand {
  id: string;
  name: string;
  display_name: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a UUID for new records
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useBrandSuggestions() {
  const db = useSQLiteContext();
  const { user, isPro } = useAuth();

  /**
   * Get brand suggestions matching a query
   * Returns max 5 suggestions, prioritizing user's brands then global brands
   */
  const getSuggestions = useCallback(
    async (query: string): Promise<string[]> => {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const normalizedQuery = query.toLowerCase().trim();

      try {
        // Search for brands matching the query
        // Priority: user-specific brands first, then global brands (user_id = NULL)
        const results = await db.getAllAsync<{ display_name: string }>(
          `SELECT DISTINCT display_name FROM yarn_brands
           WHERE name LIKE ?
           ORDER BY
             CASE WHEN user_id = ? THEN 0 ELSE 1 END,
             display_name ASC
           LIMIT 5`,
          [`${normalizedQuery}%`, user?.id ?? null]
        );

        return results.map((r) => r.display_name);
      } catch (error) {
        console.error('[BrandSuggestions] Error getting suggestions:', error);
        return [];
      }
    },
    [db, user?.id]
  );

  /**
   * Learn a new brand from user input
   * Normalizes the name and stores in SQLite
   * Will sync to Supabase for Pro users on next sync
   */
  const learnBrand = useCallback(
    async (brandName: string): Promise<void> => {
      if (!brandName || brandName.trim().length === 0) {
        return;
      }

      const displayName = brandName.trim();
      const normalizedName = displayName.toLowerCase();
      const userId = user?.id ?? null;
      const timestamp = new Date().toISOString();

      try {
        // Check if brand already exists (for this user or globally)
        const existing = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM yarn_brands
           WHERE name = ? AND (user_id = ? OR user_id IS NULL)`,
          [normalizedName, userId]
        );

        if (existing) {
          // Brand already exists, no need to add
          return;
        }

        // Insert new brand for this user
        const id = generateUUID();
        await db.runAsync(
          `INSERT INTO yarn_brands (id, name, display_name, user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, normalizedName, displayName, userId, timestamp, timestamp]
        );

        console.log('[BrandSuggestions] Learned new brand:', displayName);
      } catch (error) {
        // Likely a duplicate - ignore
        console.log('[BrandSuggestions] Brand already exists or error:', error);
      }
    },
    [db, user?.id]
  );

  /**
   * Sync brands with Supabase (Pro users only)
   * Bidirectional: pushes local brands to cloud, pulls cloud brands to local
   */
  const syncBrands = useCallback(async (): Promise<void> => {
    if (!isPro || !user?.id || !isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      // Get local user brands
      const localBrands = await db.getAllAsync<YarnBrand>(
        `SELECT * FROM yarn_brands WHERE user_id = ?`,
        [user.id]
      );

      // Get remote brands from Supabase
      // Use type assertion since Supabase types may not include yarn_brands yet
      const { data: remoteBrands, error } = await (supabase as any)
        .from('yarn_brands')
        .select('*')
        .eq('user_id', user.id) as { data: SupabaseYarnBrand[] | null; error: any };

      if (error) {
        console.error('[BrandSuggestions] Supabase fetch error:', error);
        return;
      }

      const remoteData = remoteBrands ?? [];
      const localNames = new Set(localBrands.map((b) => b.name));
      const remoteNames = new Set(remoteData.map((b) => b.name));

      // Push local brands not in Supabase
      const toUpload = localBrands.filter((b) => !remoteNames.has(b.name));
      if (toUpload.length > 0) {
        const uploadData: YarnBrandInsert[] = toUpload.map((b) => ({
          id: b.id,
          name: b.name,
          display_name: b.display_name,
          user_id: user.id,
          created_at: b.created_at,
          updated_at: b.updated_at,
        }));

        // Use type assertion since Supabase types may not include yarn_brands yet
        const { error: uploadError } = await (supabase as any)
          .from('yarn_brands')
          .upsert(uploadData, { onConflict: 'name,user_id' });

        if (uploadError) {
          console.error('[BrandSuggestions] Upload error:', uploadError);
        } else {
          console.log(`[BrandSuggestions] Uploaded ${toUpload.length} brands`);
        }
      }

      // Pull remote brands not in local SQLite
      const toDownload = remoteData.filter((b) => !localNames.has(b.name));
      if (toDownload.length > 0) {
        for (const brand of toDownload) {
          await db.runAsync(
            `INSERT OR IGNORE INTO yarn_brands (id, name, display_name, user_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              brand.id,
              brand.name,
              brand.display_name,
              brand.user_id,
              brand.created_at,
              brand.updated_at,
            ]
          );
        }
        console.log(`[BrandSuggestions] Downloaded ${toDownload.length} brands`);
      }
    } catch (error) {
      console.error('[BrandSuggestions] Sync error:', error);
    }
  }, [db, user?.id, isPro]);

  /**
   * Get all brands for display (e.g., in a list)
   */
  const getAllBrands = useCallback(async (): Promise<string[]> => {
    try {
      const results = await db.getAllAsync<{ display_name: string }>(
        `SELECT DISTINCT display_name FROM yarn_brands
         WHERE user_id = ? OR user_id IS NULL
         ORDER BY display_name ASC`,
        [user?.id ?? null]
      );

      return results.map((r) => r.display_name);
    } catch (error) {
      console.error('[BrandSuggestions] Error getting all brands:', error);
      return [];
    }
  }, [db, user?.id]);

  return {
    getSuggestions,
    learnBrand,
    syncBrands,
    getAllBrands,
  };
}
