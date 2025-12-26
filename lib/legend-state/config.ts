/**
 * Legend-State Configuration for Supabase Sync
 *
 * Configuration utilities for offline-first sync.
 * Follows official Expo and Supabase documentation (2025).
 *
 * NOTE: SQLite and Supabase schemas are now aligned.
 * No status/category mappings needed - values are identical.
 *
 * @see https://supabase.com/blog/local-first-expo-legend-state
 * @see https://docs.expo.dev/guides/local-first/#legend-state
 */

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a UUID for new records.
 * Required for creating new items with consistent IDs.
 */
export function generateId(): string {
  return uuidv4();
}

// ============================================================================
// SCHEMA ALIGNMENT NOTE
// ============================================================================

/**
 * SQLite and Supabase schemas are now aligned (as of migration 00015).
 *
 * Status values (same in both):
 * - 'to-do'
 * - 'in-progress'
 * - 'on-hold'
 * - 'completed'
 * - 'frogged'
 *
 * Category values (same in both):
 * - 'yarn'
 * - 'hook'
 * - 'other'
 *
 * Field names (same in both):
 * - inventory_items.name (not 'title')
 * - inventory_items.other_details (not 'notion_details')
 *
 * No conversion mappings are needed.
 */
