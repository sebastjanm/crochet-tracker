/**
 * Supabase Sync Hook
 *
 * Provides sync functionality between local SQLite and Supabase cloud.
 * For Pro users only - free users use local-only storage.
 * Uses Legend-State SyncManager for production-grade offline-first sync.
 *
 * @see https://docs.expo.dev/guides/local-first/#legend-state
 * @see https://supabase.com/blog/local-first-expo-legend-state
 *
 * @example
 * ```tsx
 * function SyncButton() {
 *   const { sync, isSyncing, lastSyncedAt, isEnabled } = useSupabaseSync();
 *
 *   if (!isEnabled) return null;
 *
 *   return (
 *     <Button
 *       title={isSyncing ? 'Syncing...' : 'Sync Now'}
 *       onPress={sync}
 *       disabled={isSyncing}
 *     />
 *   );
 * }
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getSyncManager, type SyncResult } from '@/lib/legend-state';
import {
  mapLocalProjectToCloud,
  mapLocalInventoryToCloud,
  mapCloudProjectToLocal,
  mapCloudInventoryToLocal,
} from '@/lib/legend-state';
import { mapProjectToRow, mapInventoryItemToRow } from '@/lib/database/schema';
import type { Project as CloudProject, InventoryItem as CloudInventoryItem } from '@/lib/supabase/database.types';
import { useAuth } from '@/hooks/auth-context';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useNetworkState } from '@/hooks/useNetworkState';
import Storage from 'expo-sqlite/kv-store';

const LAST_SYNCED_KEY = 'supabase_last_synced_at';

// ============================================================================
// SQLITE WRITE HELPERS
// ============================================================================

/**
 * Write pulled cloud projects to local SQLite database.
 * Uses INSERT OR REPLACE to handle both new records and updates.
 *
 * @param cloudProjects - Projects pulled from Supabase
 * @param userId - Current user ID
 * @param db - SQLite database instance
 */
async function writePulledProjectsToSQLite(
  cloudProjects: CloudProject[],
  userId: string,
  db: SQLiteDatabase
): Promise<number> {
  let written = 0;

  for (const cloudProject of cloudProjects) {
    try {
      const localProject = mapCloudProjectToLocal(cloudProject);
      const row = mapProjectToRow(localProject);

      await db.runAsync(
        `INSERT OR REPLACE INTO projects (
          id, title, description, status, project_type, images, default_image_index,
          pattern_pdf, pattern_url, pattern_images, inspiration_url, notes,
          yarn_used, yarn_used_ids, hook_used_ids, yarn_materials, work_progress,
          inspiration_sources, start_date, completed_date, created_at, updated_at,
          pending_sync, user_id, currently_working_on, currently_working_on_at,
          currently_working_on_ended_at, deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localProject.id,
          row.title,
          row.description,
          row.status,
          row.project_type,
          row.images,
          row.default_image_index,
          row.pattern_pdf,
          row.pattern_url,
          row.pattern_images,
          row.inspiration_url,
          row.notes,
          row.yarn_used,
          row.yarn_used_ids,
          row.hook_used_ids,
          row.yarn_materials,
          row.work_progress,
          row.inspiration_sources,
          row.start_date,
          row.completed_date,
          localProject.createdAt.toISOString(),
          localProject.updatedAt.toISOString(),
          0, // pending_sync = false (already synced from cloud)
          userId,
          row.currently_working_on,
          row.currently_working_on_at,
          row.currently_working_on_ended_at,
          0, // deleted = false
        ]
      );
      written++;
    } catch (error) {
      console.error(`[Sync] Failed to write project ${cloudProject.id}:`, error);
      // Continue with next project - don't let one failure block all
    }
  }

  if (written > 0) {
    console.log(`[Sync] Wrote ${written} projects to SQLite`);
  }

  return written;
}

/**
 * Write pulled cloud inventory items to local SQLite database.
 * Uses INSERT OR REPLACE to handle both new records and updates.
 *
 * @param cloudItems - Inventory items pulled from Supabase
 * @param userId - Current user ID
 * @param db - SQLite database instance
 */
async function writePulledInventoryToSQLite(
  cloudItems: CloudInventoryItem[],
  userId: string,
  db: SQLiteDatabase
): Promise<number> {
  let written = 0;

  for (const cloudItem of cloudItems) {
    try {
      const localItem = mapCloudInventoryToLocal(cloudItem);
      const row = mapInventoryItemToRow(localItem);

      await db.runAsync(
        `INSERT OR REPLACE INTO inventory_items (
          id, category, name, description, images, quantity, unit,
          yarn_details, hook_details, other_details, location, tags,
          used_in_projects, notes, barcode, date_added, last_updated,
          pending_sync, user_id, deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localItem.id,
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
          localItem.dateAdded.toISOString(),
          localItem.lastUpdated.toISOString(),
          0, // pending_sync = false (already synced from cloud)
          userId,
          0, // deleted = false
        ]
      );
      written++;
    } catch (error) {
      console.error(`[Sync] Failed to write inventory item ${cloudItem.id}:`, error);
      // Continue with next item - don't let one failure block all
    }
  }

  if (written > 0) {
    console.log(`[Sync] Wrote ${written} inventory items to SQLite`);
  }

  return written;
}

// ============================================================================
// SYNC STATE TYPES
// ============================================================================

export interface SyncState {
  /** Whether sync is currently in progress */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncedAt: Date | null;
  /** Last sync error, if any */
  error: Error | null;
  /** Whether Supabase sync is configured and user is Pro */
  isEnabled: boolean;
  /** Whether device is online */
  isOnline: boolean;
  /** Last sync result */
  lastResult: SyncResult | null;
}

export interface UseSupabaseSyncReturn extends SyncState {
  /** Trigger a manual sync */
  sync: () => Promise<SyncResult | null>;
  /** Clear the last error */
  clearError: () => void;
}

export function useSupabaseSync(): UseSupabaseSyncReturn {
  const db = useSQLiteContext();
  const { user, isPro } = useAuth();
  const { projects, refreshProjects } = useProjects();
  const { items, refreshItems } = useInventory();
  const { isConnected } = useNetworkState();
  const syncManagerRef = useRef<ReturnType<typeof getSyncManager>>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  // Check if sync is enabled (Supabase configured + Pro user + online)
  const isSupabaseReady = isSupabaseConfigured();
  const isEnabled = isSupabaseReady && isPro;
  const isOnline = isConnected ?? false;

  // Initialize sync manager for Pro users
  useEffect(() => {
    if (isEnabled && user?.id) {
      syncManagerRef.current = getSyncManager(user.id, isPro, {
        onProjectsChanged: refreshProjects,
        onInventoryChanged: refreshItems,
      });

      // Initialize realtime subscriptions
      syncManagerRef.current?.initialize().catch((err) => {
        console.warn('[Sync] Failed to initialize sync manager:', err);
      });
    }
  }, [isEnabled, user?.id, isPro, refreshProjects, refreshItems]);

  // Load last synced timestamp on mount
  useEffect(() => {
    async function loadLastSynced() {
      try {
        const stored = await Storage.getItem(LAST_SYNCED_KEY);
        if (stored) {
          setLastSyncedAt(new Date(stored));
        }
      } catch (err) {
        console.warn('[Sync] Failed to load last synced timestamp:', err);
      }
    }
    loadLastSynced();
  }, []);

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (!isEnabled) {
      console.log('[Sync] Skipped - not enabled (Pro required)');
      return null;
    }

    if (!isOnline) {
      console.log('[Sync] Skipped - offline');
      setError(new Error('No internet connection'));
      return null;
    }

    if (!user?.id) {
      console.log('[Sync] Skipped - no user ID');
      setError(new Error('Not authenticated'));
      return null;
    }

    if (isSyncing) {
      console.log('[Sync] Already in progress');
      return null;
    }

    const syncManager = syncManagerRef.current;
    if (!syncManager) {
      console.log('[Sync] Sync manager not initialized');
      setError(new Error('Sync not initialized'));
      return null;
    }

    setIsSyncing(true);
    setError(null);

    const result: SyncResult = {
      success: true,
      pullCount: 0,
      pushCount: 0,
      errors: [],
    };

    try {
      console.log('[Sync] Starting full sync...');

      // Ensure manager is initialized
      if (!syncManager.isReady()) {
        await syncManager.initialize();
      }

      // Push all local projects to cloud
      for (const project of projects) {
        try {
          const cloudProject = mapLocalProjectToCloud(project, user.id);
          // Add deleted: false for push - mappers don't set it to avoid overwriting soft deletes
          await syncManager.pushProject({ ...cloudProject, deleted: false });
          result.pushCount++;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Project ${project.id}: ${errMsg}`);
        }
      }

      // Push all local inventory items to cloud
      for (const item of items) {
        try {
          const cloudItem = mapLocalInventoryToCloud(item, user.id);
          // Add deleted: false for push - mappers don't set it to avoid overwriting soft deletes
          await syncManager.pushInventoryItem({ ...cloudItem, deleted: false });
          result.pushCount++;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Inventory ${item.id}: ${errMsg}`);
        }
      }

      // Pull from cloud
      const cloudProjects = await syncManager.pullProjects();
      const cloudInventory = await syncManager.pullInventoryItems();
      result.pullCount = cloudProjects.length + cloudInventory.length;

      // Write pulled cloud data to SQLite (the local source of truth)
      if (cloudProjects.length > 0) {
        await writePulledProjectsToSQLite(cloudProjects, user.id, db);
      }
      if (cloudInventory.length > 0) {
        await writePulledInventoryToSQLite(cloudInventory, user.id, db);
      }

      // Refresh local state to pick up the newly written data
      await Promise.all([refreshProjects(), refreshItems()]);

      const now = new Date();
      setLastSyncedAt(now);
      setLastResult(result);

      // Persist last synced timestamp
      await Storage.setItem(LAST_SYNCED_KEY, now.toISOString());

      result.success = result.errors.length === 0;

      if (result.success) {
        console.log(
          `[Sync] Completed: pushed ${result.pushCount}, pulled ${result.pullCount}`
        );
      } else {
        console.warn('[Sync] Completed with errors:', result.errors);
        setError(new Error(result.errors.join(', ')));
      }

      return result;
    } catch (err) {
      const syncError = err instanceof Error ? err : new Error(String(err));
      console.error('[Sync] Failed:', syncError);
      setError(syncError);
      result.success = false;
      result.errors.push(syncError.message);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isEnabled, isOnline, user?.id, isSyncing, projects, items, refreshProjects, refreshItems, db]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sync,
    isSyncing,
    lastSyncedAt,
    error,
    isEnabled,
    isOnline,
    lastResult,
    clearError,
  };
}

export default useSupabaseSync;
