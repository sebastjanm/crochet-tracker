/**
 * Supabase Sync Hook
 *
 * Provides sync functionality between local SQLite and Supabase cloud.
 * For Pro users only - free users use local-only storage.
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

import { useState, useCallback, useEffect } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fullSync, type SyncResult } from '@/lib/sync/supabase-sync';
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
  const { projects } = useProjects();
  const { items } = useInventory();
  const { isConnected } = useNetworkState();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  // Check if sync is enabled (Supabase configured + Pro user + online)
  const isSupabaseReady = isSupabaseConfigured();
  // TODO: Restore `&& isPro` for production
  const isEnabled = isSupabaseReady;
  const isOnline = isConnected ?? false;

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

    setIsSyncing(true);
    setError(null);

    try {
      console.log('[Sync] Starting full sync...');

      const result = await fullSync(
        projects,
        items,
        user.id,
        lastSyncedAt ?? undefined
      );

      const now = new Date();
      setLastSyncedAt(now);
      setLastResult(result);

      // Persist last synced timestamp
      await Storage.setItem(LAST_SYNCED_KEY, now.toISOString());

      if (result.success) {
        console.log(
          `[Sync] Completed: pushed ${result.pushed}, pulled ${result.pulled}`
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
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isEnabled, isOnline, user?.id, isSyncing, projects, items, lastSyncedAt]);

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
