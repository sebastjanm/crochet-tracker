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
  usedYarnMeters: number;
  unusedYarnMeters: number;
  // Yarn value
  totalYarnValue: number;
  usedYarnValue: number;
  unusedYarnValue: number;
  // Hooks value
  totalHookValue: number;
  // Total inventory value (yarn + hooks)
  totalInventoryValue: number;
  inventoryCurrency: string | null;

  // Creations
  completedCount: number;
  inProgressCount: number;
  onHoldCount: number;
  toDoCount: number;

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
 * Calculate used vs unused yarn meters and value
 * Used = yarn linked to projects via yarnMaterials
 * Unused = remaining yarn in inventory
 */
function calculateYarnUsage(
  items: InventoryItem[],
  projects: Project[]
): {
  usedMeters: number;
  unusedMeters: number;
  usedValue: number;
  unusedValue: number;
  totalValue: number;
  currency: string | null;
} {
  const yarnItems = items.filter(
    (item) => item.category === 'yarn'
  );

  // Build a map of yarn ID -> total skeins used in projects
  const usedSkeinsMap = new Map<string, number>();

  for (const project of projects) {
    if (project.yarnMaterials) {
      for (const material of project.yarnMaterials) {
        const current = usedSkeinsMap.get(material.itemId) ?? 0;
        usedSkeinsMap.set(material.itemId, current + material.quantity);
      }
    }
  }

  let usedMeters = 0;
  let unusedMeters = 0;
  let usedValue = 0;
  let unusedValue = 0;
  let totalValue = 0;
  let detectedCurrency: string | null = null;

  for (const item of yarnItems) {
    const metersPerSkein = item.yarnDetails?.meters ?? 0;
    const pricePerSkein = item.yarnDetails?.purchasePrice ?? 0;
    const totalSkeins = item.quantity ?? 1;
    const usedSkeins = Math.min(usedSkeinsMap.get(item.id) ?? 0, totalSkeins);
    const unusedSkeins = Math.max(0, totalSkeins - usedSkeins);

    // Meters
    usedMeters += usedSkeins * metersPerSkein;
    unusedMeters += unusedSkeins * metersPerSkein;

    // Value
    usedValue += usedSkeins * pricePerSkein;
    unusedValue += unusedSkeins * pricePerSkein;
    totalValue += totalSkeins * pricePerSkein;

    // Detect currency (use first found)
    if (!detectedCurrency && item.yarnDetails?.currency) {
      detectedCurrency = item.yarnDetails.currency;
    }
  }

  return {
    usedMeters,
    unusedMeters,
    usedValue,
    unusedValue,
    totalValue,
    currency: detectedCurrency,
  };
}

/**
 * Calculate total hook value from inventory
 */
function calculateHookValue(items: InventoryItem[]): {
  totalValue: number;
  currency: string | null;
} {
  let totalValue = 0;
  let detectedCurrency: string | null = null;

  for (const item of items) {
    if (item.category === 'hook' && item.hookDetails?.purchasePrice) {
      const price = item.hookDetails.purchasePrice;
      const quantity = item.quantity ?? 1;
      totalValue += price * quantity;

      if (!detectedCurrency && item.hookDetails.currency) {
        detectedCurrency = item.hookDetails.currency;
      }
    }
  }

  return { totalValue, currency: detectedCurrency };
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
  const { projects, completedCount, inProgressCount, onHoldCount, toDoCount, isLoading: projectsLoading } = useProjects();
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

    // Calculate yarn meters and value
    const totalYarnMeters = calculateTotalYarnMeters(items);
    const {
      usedMeters: usedYarnMeters,
      unusedMeters: unusedYarnMeters,
      usedValue: usedYarnValue,
      unusedValue: unusedYarnValue,
      totalValue: totalYarnValue,
      currency: yarnCurrency,
    } = calculateYarnUsage(items, projects);

    // Calculate hook value
    const { totalValue: totalHookValue, currency: hookCurrency } = calculateHookValue(items);

    // Total inventory value
    const totalInventoryValue = totalYarnValue + totalHookValue;
    const inventoryCurrency = yarnCurrency || hookCurrency;

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
      usedYarnMeters,
      unusedYarnMeters,
      // Yarn value
      totalYarnValue,
      usedYarnValue,
      unusedYarnValue,
      // Hook value
      totalHookValue,
      // Total inventory
      totalInventoryValue,
      inventoryCurrency,

      // Creations
      completedCount,
      inProgressCount,
      onHoldCount,
      toDoCount,

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
    onHoldCount,
    toDoCount,
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
export type DistanceComparison = 'footballField';

export function getDistanceComparison(meters: number): {
  type: DistanceComparison;
  count: number;
} | null {
  if (meters < 10) {
    return null; // Too little to compare
  }
  // Football field = ~100m
  const footballFields = Math.round(meters / 100);
  if (footballFields >= 1) {
    return { type: 'footballField', count: footballFields };
  }
  return null;
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
