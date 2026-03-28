/**
 * Network State Hook
 *
 * Provides real-time network connectivity information using expo-network.
 * Used for intelligent sync decisions (online/offline, WiFi/cellular).
 *
 * Returns { data, error, status } pattern for consistent error handling.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/network/
 */

import { useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';
import type { ActionResult } from '@/types';

export interface NetworkState {
  /** Whether the device has an active internet connection */
  isConnected: boolean;
  /** Whether connected via WiFi (vs cellular) */
  isWifi: boolean;
  /** Whether connected via cellular data */
  isCellular: boolean;
  /** Whether the network state is still being determined */
  isLoading: boolean;
  /** Network type (wifi, cellular, none, unknown) */
  type: Network.NetworkStateType | null;
  /** Whether airplane mode is enabled (Android only) */
  isAirplaneMode: boolean;
  /** Error from last network check (null if successful) */
  error: Error | null;
  /** Refresh network state manually */
  refresh: () => Promise<ActionResult<void>>;
}

/**
 * Hook to monitor network connectivity state.
 *
 * @example
 * ```tsx
 * function SyncButton() {
 *   const { isConnected, isWifi, isCellular, error, refresh } = useNetworkState();
 *
 *   if (error) {
 *     return <Text>Failed to check connection: {error.message}</Text>;
 *   }
 *
 *   if (!isConnected) {
 *     return <Text>Offline - changes saved locally</Text>;
 *   }
 *
 *   if (isCellular) {
 *     return <Text>On cellular - sync when on WiFi?</Text>;
 *   }
 *
 *   return <Button title="Sync Now" />;
 * }
 * ```
 */
export function useNetworkState(): NetworkState {
  const [state, setState] = useState<Omit<NetworkState, 'refresh'>>({
    isConnected: true, // Optimistic default
    isWifi: false,
    isCellular: false,
    isLoading: true,
    type: null,
    isAirplaneMode: false,
    error: null,
  });

  const refresh = useCallback(async (): Promise<ActionResult<void>> => {
    try {
      const networkState = await Network.getNetworkStateAsync();

      setState({
        isConnected: networkState.isConnected ?? false,
        isWifi: networkState.type === Network.NetworkStateType.WIFI,
        isCellular: networkState.type === Network.NetworkStateType.CELLULAR,
        isLoading: false,
        type: networkState.type ?? null,
        isAirplaneMode: false, // Will be updated by listener if available
        error: null,
      });

      return { success: true, data: undefined };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (__DEV__) console.warn('[Network] Failed to get network state:', err);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err,
      }));

      return { success: false, error: err };
    }
  }, []);

  useEffect(() => {
    // Get initial state
    refresh();

    // Listen for network changes
    const subscription = Network.addNetworkStateListener((networkState) => {
      setState({
        isConnected: networkState.isConnected ?? false,
        isWifi: networkState.type === Network.NetworkStateType.WIFI,
        isCellular: networkState.type === Network.NetworkStateType.CELLULAR,
        isLoading: false,
        type: networkState.type ?? null,
        isAirplaneMode: false,
        error: null, // Clear error on successful update
      });
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}

/**
 * Check if network is suitable for sync based on user preferences.
 *
 * @param networkState Current network state
 * @param allowCellular Whether cellular sync is allowed
 * @returns Whether sync should proceed
 */
export function canSync(
  networkState: Pick<NetworkState, 'isConnected' | 'isWifi' | 'isCellular'>,
  allowCellular: boolean
): boolean {
  if (!networkState.isConnected) {
    return false;
  }

  if (networkState.isCellular && !allowCellular) {
    return false;
  }

  return true;
}

/**
 * Get a user-friendly description of the current network state.
 */
export function getNetworkStatusMessage(
  state: Pick<NetworkState, 'isConnected' | 'isWifi' | 'isCellular' | 'isLoading' | 'error'>
): string {
  if (state.error) {
    return 'Unable to check connection';
  }

  if (state.isLoading) {
    return 'Checking connection...';
  }

  if (!state.isConnected) {
    return 'No internet connection';
  }

  if (state.isWifi) {
    return 'Connected via WiFi';
  }

  if (state.isCellular) {
    return 'Connected via cellular';
  }

  return 'Connected';
}

export default useNetworkState;
