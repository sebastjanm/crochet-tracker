/**
 * Timer Utilities
 *
 * Helper functions for time calculations and formatting.
 * All functions are pure and stateless.
 */

/**
 * Calculate elapsed minutes from a start timestamp to now.
 *
 * @param startedAt - ISO timestamp string
 * @returns Number of elapsed minutes (rounded down)
 */
export function getElapsedMinutes(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = now - start;
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Calculate elapsed seconds from a start timestamp to now.
 *
 * @param startedAt - ISO timestamp string
 * @returns Number of elapsed seconds
 */
export function getElapsedSeconds(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = now - start;
  return Math.floor(diffMs / 1000);
}

/**
 * Format minutes into a human-readable duration string.
 *
 * @param minutes - Total minutes
 * @returns Formatted string like "2h 15m" or "45m" or "0m"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Format minutes into a compact duration string (for display in cards).
 *
 * @param minutes - Total minutes
 * @returns Formatted string like "2:15" (hours:minutes)
 */
export function formatDurationCompact(minutes: number): string {
  if (minutes <= 0) return '0:00';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format elapsed time from a start timestamp as MM:SS or H:MM:SS.
 * Used for the running timer display.
 *
 * @param startedAt - ISO timestamp string
 * @returns Formatted string like "23:14" or "1:23:14"
 */
export function formatElapsed(startedAt: string): string {
  const totalSeconds = getElapsedSeconds(startedAt);

  if (totalSeconds < 0) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate duration in minutes between two timestamps.
 *
 * @param startedAt - Start ISO timestamp
 * @param endedAt - End ISO timestamp
 * @returns Duration in minutes (rounded to nearest minute)
 */
export function calculateDurationMinutes(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const diffMs = end - start;
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Parse hours and minutes strings into total minutes.
 * Used for manual time entry.
 *
 * @param hours - Hours string (can be empty or "0")
 * @param minutes - Minutes string (can be empty or "0")
 * @returns Total minutes
 */
export function parseHoursMinutesToMinutes(hours: string, minutes: string): number {
  const h = parseInt(hours, 10) || 0;
  const m = parseInt(minutes, 10) || 0;
  return h * 60 + m;
}

/**
 * Convert total minutes to hours and minutes.
 *
 * @param totalMinutes - Total minutes
 * @returns Object with hours and minutes
 */
export function minutesToHoursMinutes(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}
