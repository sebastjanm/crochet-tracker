/**
 * Journey Stats Hook
 *
 * Aggregates data from Projects, Inventory, and Time Sessions providers
 * to power the "My Journey" analytics screen.
 *
 * Design philosophy: "Story over Statistics" - warm, celebratory framing
 * that works with any data size (from 0 to hundreds of items).
 *
 * @see /docs/plans/2025-01-21-my-journey-design.md
 */

import { useMemo } from 'react';
import { useProjects } from '@/providers/ProjectsProvider';
import { useInventory } from '@/providers/InventoryProvider';
import { useTimeSessions } from '@/providers/TimeSessionsProvider';
import type { Project, InventoryItem } from '@/types';

export interface JourneyStats {
  // Journey timeline
  journeyStartDate: Date | null;
  firstCompletedProjectName: string | null;
  monthsOnJourney: number;

  // Time investment
  totalMinutes: number;
  totalHours: number;

  // Collection
  yarnCount: number;
  hookCount: number;
  totalYarnMeters: number;

  // Creations
  completedCount: number;
  inProgressCount: number;

  // Loading state
  isLoading: boolean;

  // Has any data (to determine empty state)
  hasAnyData: boolean;
}

/**
 * Get the earliest project createdAt date
 */
function getJourneyStartDate(projects: Project[]): Date | null {
  if (projects.length === 0) return null;

  const sorted = [...projects].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return new Date(sorted[0].createdAt);
}

/**
 * Get the name of the first completed project
 */
function getFirstCompletedProjectName(projects: Project[]): string | null {
  const completed = projects
    .filter((p) => p.status === 'completed' && p.completedDate)
    .sort(
      (a, b) =>
        new Date(a.completedDate!).getTime() - new Date(b.completedDate!).getTime()
    );

  if (completed.length === 0) {
    // No completed projects - check if there's any project at all
    // If so, return the first project's title (still in progress)
    const sorted = [...projects].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sorted.length > 0 ? sorted[0].title : null;
  }

  return completed[0].title;
}

/**
 * Calculate months between journey start and now
 */
function calculateMonthsOnJourney(startDate: Date | null): number {
  if (!startDate) return 0;

  const now = new Date();
  const months =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  return Math.max(0, months);
}

/**
 * Calculate total yarn meters from inventory
 * Sums yarnDetails.meters * quantity for all yarn items
 */
function calculateTotalYarnMeters(items: InventoryItem[]): number {
  return items
    .filter((item) => item.category === 'yarn' && item.yarnDetails?.meters)
    .reduce((total, item) => {
      const metersPerSkein = item.yarnDetails?.meters ?? 0;
      const quantity = item.quantity ?? 1;
      return total + metersPerSkein * quantity;
    }, 0);
}

/**
 * Calculate total minutes from all time sessions across all projects
 */
function calculateTotalMinutesFromProjects(
  getTotalMinutes: (projectId: string) => number,
  projects: Project[]
): number {
  let total = 0;

  for (const project of projects) {
    total += getTotalMinutes(project.id);
  }

  return total;
}

/**
 * Hook to aggregate journey statistics from all data providers
 */
export function useJourneyStats(): JourneyStats {
  const { projects, completedCount, inProgressCount, isLoading: projectsLoading } = useProjects();
  const { items, yarnCount, hookCount, isLoading: inventoryLoading } = useInventory();
  const { getTotalMinutes, isLoading: sessionsLoading } = useTimeSessions();

  return useMemo(() => {
    const isLoading = projectsLoading || inventoryLoading || sessionsLoading;

    // Calculate journey timeline
    const journeyStartDate = getJourneyStartDate(projects);
    const firstCompletedProjectName = getFirstCompletedProjectName(projects);
    const monthsOnJourney = calculateMonthsOnJourney(journeyStartDate);

    // Calculate time investment
    const totalMinutes = calculateTotalMinutesFromProjects(getTotalMinutes, projects);
    const totalHours = Math.round(totalMinutes / 60);

    // Calculate yarn meters
    const totalYarnMeters = calculateTotalYarnMeters(items);

    // Determine if user has any data
    const hasAnyData = projects.length > 0 || items.length > 0;

    return {
      // Journey timeline
      journeyStartDate,
      firstCompletedProjectName,
      monthsOnJourney,

      // Time investment
      totalMinutes,
      totalHours,

      // Collection
      yarnCount,
      hookCount,
      totalYarnMeters,

      // Creations
      completedCount,
      inProgressCount,

      // Loading state
      isLoading,

      // Has any data
      hasAnyData,
    };
  }, [
    projects,
    items,
    completedCount,
    inProgressCount,
    yarnCount,
    hookCount,
    getTotalMinutes,
    projectsLoading,
    inventoryLoading,
    sessionsLoading,
  ]);
}

// ============================================================================
// HELPER FUNCTIONS FOR UI FORMATTING
// ============================================================================

/**
 * Get fun time comparison based on total hours
 */
export type TimeComparison =
  | 'podcast'
  | 'movies'
  | 'tvSeason'
  | 'roadTrip'
  | 'masterCrafter';

export function getTimeComparison(hours: number): {
  type: TimeComparison;
  count?: number;
} {
  if (hours < 1) {
    return { type: 'podcast' };
  }
  if (hours <= 5) {
    return { type: 'podcast' };
  }
  if (hours <= 20) {
    return { type: 'movies', count: Math.floor(hours / 2) };
  }
  if (hours <= 50) {
    return { type: 'tvSeason' };
  }
  if (hours <= 100) {
    return { type: 'roadTrip' };
  }
  return { type: 'masterCrafter' };
}

/**
 * Get fun distance comparison based on total meters
 */
export type DistanceComparison =
  | 'footballField'
  | 'statueOfLiberty'
  | 'eiffelTower'
  | 'runningTrack'
  | 'yarnBomb';

export function getDistanceComparison(meters: number): {
  type: DistanceComparison;
  count?: number;
} | null {
  if (meters < 10) {
    return null; // Too little to compare
  }
  if (meters <= 100) {
    return { type: 'footballField' };
  }
  if (meters <= 300) {
    return { type: 'statueOfLiberty' };
  }
  if (meters <= 500) {
    return { type: 'eiffelTower' };
  }
  if (meters <= 1000) {
    return { type: 'runningTrack', count: Math.floor(meters / 400) };
  }
  return { type: 'yarnBomb', count: Math.round(meters / 1000) };
}

/**
 * Format a date for journey display (e.g., "May 2024")
 */
export function formatJourneyDate(date: Date, locale = 'en'): string {
  return date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}
