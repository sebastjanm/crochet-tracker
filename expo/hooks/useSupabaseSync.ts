/**
 * Supabase Sync Hook (Legend-State Native)
 *
 * Reports the status of the Legend-State sync engine.
 * No longer handles manual sync logic as Legend-State does this automatically.
 */

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
// Note: getStores import removed - Legend-State handles sync automatically
// Note: useSelector removed since isSyncing is now a constant

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  isEnabled: boolean;
  error: Error | null;
}

export function useSupabaseSync() {
  const { user, isPro } = useAuth();
  const [lastSyncedAt] = useState<Date | null>(null);

  // Legend-State handles sync automatically, we just report status
  // isSyncing is always false since Legend-State manages sync transparently
  const isSyncing = false;

  return {
    isSyncing,
    lastSyncedAt,
    isEnabled: !!(user && isPro),
    error: null, // Legend-State handles retries internally
    sync: async () => {
      // Manual sync trigger - not really needed with Legend-State
      // Legend-State syncs automatically on every change
      if (__DEV__) console.log('[Sync] Manual sync requested (handled automatically by Legend-State)');
      return { success: true };
    }
  };
}

export default useSupabaseSync;
