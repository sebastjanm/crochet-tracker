/**
 * Timer Store - Active Timer State
 *
 * Stores the currently running timer (if any).
 * - Persisted to AsyncStorage (survives app restarts)
 * - NOT synced to Supabase (timer is device-local)
 * - Only ONE timer can run at a time (across all projects)
 *
 * @see https://legendapp.com/open-source/state/v3/sync/persist/
 */

import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActiveTimer } from '@/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Create a persistence plugin instance
const asyncStoragePlugin = observablePersistAsyncStorage({ AsyncStorage });

// ============================================================================
// ACTIVE TIMER STATE
// ============================================================================

/**
 * Active timer observable.
 * - null = no timer running
 * - { projectId, startedAt } = timer is running for that project
 */
export const activeTimer$ = observable<ActiveTimer | null>(null);

// Configure local persistence
syncObservable(activeTimer$, {
  persist: {
    plugin: asyncStoragePlugin,
    name: 'activeTimer',
  },
});

// ============================================================================
// TIMER ACTIONS
// ============================================================================

/**
 * Start a timer for a project.
 * If a timer is already running, this does nothing (returns false).
 */
export function startTimer(projectId: string): boolean {
  const current = activeTimer$.get();

  // Already running for this project
  if (current?.projectId === projectId) {
    if (__DEV__) console.log('[Timer] Already running for this project');
    return false;
  }

  // Another timer is running
  if (current !== null) {
    if (__DEV__) console.log('[Timer] Another timer is running, cannot start new one');
    return false;
  }

  // Start new timer
  const timer: ActiveTimer = {
    projectId,
    startedAt: new Date().toISOString(),
  };

  activeTimer$.set(timer);

  if (__DEV__) {
    console.log('[Timer] Started:', timer);
  }

  return true;
}

/**
 * Stop the current timer.
 * Returns the timer state at stop time (for calculating duration), or null if no timer was running.
 */
export function stopTimer(): ActiveTimer | null {
  const current = activeTimer$.get();

  if (!current) {
    if (__DEV__) console.log('[Timer] No timer running');
    return null;
  }

  // Clear the timer
  activeTimer$.set(null);

  if (__DEV__) {
    console.log('[Timer] Stopped:', current);
  }

  return current;
}

/**
 * Get current active timer state.
 */
export function getActiveTimer(): ActiveTimer | null {
  return activeTimer$.get();
}

/**
 * Check if timer is running for a specific project.
 */
export function isTimerRunningForProject(projectId: string): boolean {
  const current = activeTimer$.get();
  return current?.projectId === projectId;
}

/**
 * Check if any timer is running.
 */
export function isAnyTimerRunning(): boolean {
  return activeTimer$.get() !== null;
}

/**
 * Force stop timer (for edge cases like project deletion).
 */
export function forceStopTimer(): void {
  activeTimer$.set(null);
  if (__DEV__) console.log('[Timer] Force stopped');
}
