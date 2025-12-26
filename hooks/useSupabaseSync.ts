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
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getSyncManager, type SyncResult } from '@/lib/legend-state';
import { mapLocalProjectToCloud, mapLocalInventoryToCloud } from '@/lib/legend-state';
import { useAuth } from '@/hooks/auth-context';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useNetworkState } from '@/hooks/useNetworkState';
import Storage from 'expo-sqlite/kv-store';

const LAST_SYNCED_KEY = 'supabase_last_synced_at';

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
          await syncManager.pushProject(cloudProject);
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
          await syncManager.pushInventoryItem(cloudItem);
          result.pushCount++;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Inventory ${item.id}: ${errMsg}`);
        }
      }

      // Pull from cloud and refresh local state
      const cloudProjects = await syncManager.pullProjects();
      const cloudInventory = await syncManager.pullInventoryItems();
      result.pullCount = cloudProjects.length + cloudInventory.length;

      // Refresh local state to pick up any cloud changes
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
  }, [isEnabled, isOnline, user?.id, isSyncing, projects, items, refreshProjects, refreshItems]);

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
