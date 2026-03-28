/**
 * Time Sessions Provider
 *
 * Manages project time tracking:
 * - Active timer state (start/stop)
 * - Time sessions CRUD
 * - Computed totals
 *
 * ARCHITECTURE:
 * - Active timer: Legend-State observable (local persistence only)
 * - Time sessions: Supabase for Pro users, AsyncStorage for free
 *
 * @see /Users/sebastjanm/.claude/plans/synchronous-conjuring-allen.md
 */

import { useCallback, useMemo, useEffect, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useObserve } from '@legendapp/state/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/providers/AuthProvider';
import { supabase, requireSupabase } from '@/lib/supabase/client';
import {
  activeTimer$,
  startTimer as startTimerAction,
  stopTimer as stopTimerAction,
  isTimerRunningForProject,
} from '@/lib/legend-state';
import {
  calculateDurationMinutes,
  formatDuration,
  formatDurationCompact,
} from '@/lib/timer-utils';
import type { ActiveTimer, ProjectTimeSession } from '@/types';
import type { TimeSessionInsert } from '@/lib/supabase/database.types';

// ============================================================================
// TYPES
// ============================================================================

interface TimeSessionsContextValue {
  // Timer state
  activeTimer: ActiveTimer | null;
  isTimerRunning: boolean;

  // Timer actions
  startTimer: (projectId: string) => boolean;
  stopTimer: () => Promise<ProjectTimeSession | null>;

  // Manual entry (unified: duration and/or note required)
  addManualSession: (
    projectId: string,
    date: Date,
    durationMinutes: number | null,
    note?: string
  ) => Promise<ProjectTimeSession | null>;

  // Queries
  getSessionsForProject: (projectId: string) => ProjectTimeSession[];
  getTotalMinutes: (projectId: string) => number;

  // Session updates
  updateSessionNote: (sessionId: string, note: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>;

  // Helpers
  isTimerRunningFor: (projectId: string) => boolean;
  formatTotalTime: (projectId: string) => string;

  // Loading state
  isLoading: boolean;
}

// Local storage key for free users
const LOCAL_SESSIONS_KEY = 'time_sessions';

// ============================================================================
// PROVIDER
// ============================================================================

export const [TimeSessionsProvider, useTimeSessions] = createContextHook((): TimeSessionsContextValue => {
  const { user, isPro } = useAuth();

  // Local state for sessions (loaded from AsyncStorage or Supabase)
  const [sessions, setSessions] = useState<Record<string, ProjectTimeSession[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Active timer state (reactive via Legend-State)
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Observe active timer changes
  useObserve(() => {
    const timer = activeTimer$.get();

    // Clear corrupted timer state (missing projectId or startedAt)
    if (timer && (!timer.projectId || !timer.startedAt)) {
      if (__DEV__) console.log('[TimeSessions] Clearing corrupted timer state:', timer);
      activeTimer$.set(null);
      setActiveTimer(null);
      return;
    }

    setActiveTimer(timer);
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isPro]);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      if (user?.id && isPro && supabase) {
        // Pro user: Load from Supabase
        const { data, error } = await supabase
          .from('project_time_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });

        if (error) {
          console.error('[TimeSessions] Supabase load error:', error);
        } else if (data) {
          // Group by project_id
          const grouped: Record<string, ProjectTimeSession[]> = {};
          data.forEach((row) => {
            const session = mapRowToSession(row);
            if (!grouped[session.projectId]) {
              grouped[session.projectId] = [];
            }
            grouped[session.projectId].push(session);
          });
          setSessions(grouped);
        }
      } else {
        // Free user: Load from AsyncStorage
        const stored = await AsyncStorage.getItem(LOCAL_SESSIONS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, ProjectTimeSession[]>;
          // Restore Date objects
          Object.values(parsed).forEach((projectSessions) => {
            projectSessions.forEach((s) => {
              s.startedAt = new Date(s.startedAt);
              s.endedAt = new Date(s.endedAt);
              s.createdAt = new Date(s.createdAt);
              s.updatedAt = new Date(s.updatedAt);
            });
          });
          setSessions(parsed);

          if (__DEV__) {
            const total = Object.values(parsed).flat().length;
            console.log(`[TimeSessions] Loaded ${total} sessions from AsyncStorage`);
          }
        }
      }
    } catch (error) {
      console.error('[TimeSessions] Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isPro]);

  // ============================================================================
  // SESSION PERSISTENCE
  // ============================================================================

  const saveSessionsLocally = useCallback(async (newSessions: Record<string, ProjectTimeSession[]>) => {
    try {
      await AsyncStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(newSessions));
    } catch (error) {
      console.error('[TimeSessions] Local save error:', error);
    }
  }, []);

  const saveSessionToSupabase = useCallback(async (session: ProjectTimeSession): Promise<boolean> => {
    if (!user?.id || !supabase) return false;

    const insert: TimeSessionInsert = {
      id: session.id,
      user_id: user.id,
      project_id: session.projectId,
      started_at: session.startedAt.toISOString(),
      ended_at: session.endedAt.toISOString(),
      duration_minutes: session.durationMinutes,
      source: session.source,
      note: session.note ?? null,
    };

    // TODO: Re-run `supabase gen types typescript` to fix type inference
    const { error } = await (requireSupabase() as unknown as { from: (table: string) => { insert: (data: unknown) => Promise<{ error: Error | null }> } })
      .from('project_time_sessions')
      .insert(insert);

    if (error) {
      console.error('[TimeSessions] Supabase save error:', error);
      return false;
    }

    if (__DEV__) {
      console.log('[TimeSessions] Session saved to Supabase:', session.id);
    }

    return true;
  }, [user?.id]);

  // ============================================================================
  // TIMER ACTIONS
  // ============================================================================

  const startTimer = useCallback((projectId: string): boolean => {
    return startTimerAction(projectId);
  }, []);

  const stopTimer = useCallback(async (): Promise<ProjectTimeSession | null> => {
    const stoppedTimer = stopTimerAction();

    if (!stoppedTimer) {
      return null;
    }

    const endedAt = new Date();
    const durationMinutes = calculateDurationMinutes(stoppedTimer.startedAt, endedAt.toISOString());

    // Create session
    const session: ProjectTimeSession = {
      id: generateId(),
      userId: user?.id ?? 'local',
      projectId: stoppedTimer.projectId,
      startedAt: new Date(stoppedTimer.startedAt),
      endedAt,
      durationMinutes: Math.max(0, durationMinutes),
      source: 'timer',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Update local state
    setSessions((prev) => {
      const projectSessions = prev[session.projectId] ?? [];
      const updated = {
        ...prev,
        [session.projectId]: [session, ...projectSessions],
      };

      // Save to appropriate storage
      if (user?.id && isPro && supabase) {
        saveSessionToSupabase(session);
      } else {
        saveSessionsLocally(updated);
      }

      return updated;
    });

    if (__DEV__) {
      console.log('[TimeSessions] Timer stopped, session created:', {
        projectId: session.projectId,
        duration: formatDuration(session.durationMinutes ?? 0),
      });
    }

    return session;
  }, [user?.id, isPro, saveSessionToSupabase, saveSessionsLocally]);

  // ============================================================================
  // MANUAL ENTRY
  // ============================================================================

  const addManualSession = useCallback(async (
    projectId: string,
    date: Date,
    durationMinutes: number | null,
    note?: string
  ): Promise<ProjectTimeSession | null> => {
    // Validation: at least duration OR note required
    const hasValidDuration = durationMinutes !== null && durationMinutes > 0;
    const hasNote = note && note.trim().length > 0;

    if (!hasValidDuration && !hasNote) {
      if (__DEV__) console.log('[TimeSessions] Invalid entry: need duration or note');
      return null;
    }

    // Create session with the date set to the provided date
    const startedAt = new Date(date);
    // For note-only entries, endedAt = startedAt (no duration)
    const endedAt = hasValidDuration
      ? new Date(startedAt.getTime() + durationMinutes! * 60 * 1000)
      : new Date(startedAt);

    const session: ProjectTimeSession = {
      id: generateId(),
      userId: user?.id ?? 'local',
      projectId,
      startedAt,
      endedAt,
      durationMinutes: hasValidDuration ? durationMinutes : null,
      source: 'manual',
      note: hasNote ? note!.trim() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Update local state
    setSessions((prev) => {
      const projectSessions = prev[projectId] ?? [];
      const updated = {
        ...prev,
        [projectId]: [session, ...projectSessions].sort(
          (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
        ),
      };

      // Save to appropriate storage
      if (user?.id && isPro && supabase) {
        saveSessionToSupabase(session);
      } else {
        saveSessionsLocally(updated);
      }

      return updated;
    });

    if (__DEV__) {
      console.log('[TimeSessions] Work entry added:', {
        projectId,
        duration: hasValidDuration ? formatDuration(durationMinutes!) : 'none',
        hasNote,
        date: date.toDateString(),
      });
    }

    return session;
  }, [user?.id, isPro, saveSessionToSupabase, saveSessionsLocally]);

  // ============================================================================
  // SESSION UPDATES
  // ============================================================================

  const updateSessionNote = useCallback(async (sessionId: string, note: string): Promise<void> => {
    // Find and update the session
    setSessions((prev) => {
      const updated = { ...prev };

      for (const projectId of Object.keys(updated)) {
        const idx = updated[projectId].findIndex((s) => s.id === sessionId);
        if (idx !== -1) {
          updated[projectId] = [...updated[projectId]];
          updated[projectId][idx] = {
            ...updated[projectId][idx],
            note,
            updatedAt: new Date(),
          };

          // Sync to storage
          if (user?.id && isPro && supabase) {
            // TODO: Re-run `supabase gen types typescript` to fix type inference
            (requireSupabase() as unknown as { from: (table: string) => { update: (data: unknown) => { eq: (col: string, val: string) => { then: (cb: (r: { error: Error | null }) => void) => void } } } })
              .from('project_time_sessions')
              .update({ note, updated_at: new Date().toISOString() })
              .eq('id', sessionId)
              .then(({ error }) => {
                if (error) console.error('[TimeSessions] Note update error:', error);
              });
          } else {
            saveSessionsLocally(updated);
          }

          break;
        }
      }

      return updated;
    });
  }, [user?.id, isPro, saveSessionsLocally]);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    let deleted = false;

    setSessions((prev) => {
      const updated = { ...prev };

      for (const projectId of Object.keys(updated)) {
        const idx = updated[projectId].findIndex((s) => s.id === sessionId);
        if (idx !== -1) {
          // Remove session from array
          updated[projectId] = updated[projectId].filter((s) => s.id !== sessionId);

          // Clean up empty project entries
          if (updated[projectId].length === 0) {
            delete updated[projectId];
          }

          deleted = true;

          // Sync to storage
          if (user?.id && isPro && supabase) {
            (requireSupabase() as unknown as { from: (table: string) => { delete: () => { eq: (col: string, val: string) => { then: (cb: (r: { error: Error | null }) => void) => void } } } })
              .from('project_time_sessions')
              .delete()
              .eq('id', sessionId)
              .then(({ error }) => {
                if (error) console.error('[TimeSessions] Delete error:', error);
              });
          } else {
            saveSessionsLocally(updated);
          }

          break;
        }
      }

      return updated;
    });

    if (__DEV__ && deleted) {
      console.log('[TimeSessions] Session deleted:', sessionId);
    }

    return deleted;
  }, [user?.id, isPro, saveSessionsLocally]);

  // ============================================================================
  // QUERIES
  // ============================================================================

  const getSessionsForProject = useCallback((projectId: string): ProjectTimeSession[] => {
    return sessions[projectId] ?? [];
  }, [sessions]);

  const getTotalMinutes = useCallback((projectId: string): number => {
    const projectSessions = sessions[projectId] ?? [];
    // Only sum entries that have duration (exclude note-only entries)
    return projectSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  }, [sessions]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const isTimerRunningFor = useCallback((projectId: string): boolean => {
    return isTimerRunningForProject(projectId);
  }, []);

  const formatTotalTime = useCallback((projectId: string): string => {
    const total = getTotalMinutes(projectId);
    return formatDurationCompact(total);
  }, [getTotalMinutes]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  return useMemo(() => ({
    // Timer state
    activeTimer,
    isTimerRunning: activeTimer !== null,

    // Timer actions
    startTimer,
    stopTimer,

    // Manual entry
    addManualSession,

    // Queries
    getSessionsForProject,
    getTotalMinutes,

    // Session updates
    updateSessionNote,
    deleteSession,

    // Helpers
    isTimerRunningFor,
    formatTotalTime,

    // Loading state
    isLoading,
  }), [
    activeTimer,
    startTimer,
    stopTimer,
    addManualSession,
    getSessionsForProject,
    getTotalMinutes,
    updateSessionNote,
    deleteSession,
    isTimerRunningFor,
    formatTotalTime,
    isLoading,
  ]);
});

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  // Generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapRowToSession(row: {
  id: string;
  user_id: string;
  project_id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number | null;
  source: 'timer' | 'manual';
  note: string | null;
  created_at: string;
  updated_at: string;
}): ProjectTimeSession {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    startedAt: new Date(row.started_at),
    endedAt: new Date(row.ended_at),
    durationMinutes: row.duration_minutes,
    source: row.source,
    note: row.note ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
