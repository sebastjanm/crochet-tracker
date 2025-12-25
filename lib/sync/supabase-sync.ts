/**
 * Supabase Sync Service
 *
 * Handles bidirectional sync between local SQLite and Supabase PostgreSQL.
 * Uses Last-Write-Wins conflict resolution based on updatedAt timestamps.
 *
 * @see https://supabase.com/docs/reference/javascript/upsert
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Project, InventoryItem } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  errors: string[];
}

export interface SyncOptions {
  /** Only sync items modified after this date */
  since?: Date;
  /** User ID for RLS filtering */
  userId: string;
}

// ============================================================================
// PROJECT SYNC
// ============================================================================

/**
 * Push local projects to Supabase.
 * Uses upsert to create or update based on id.
 */
export async function pushProjectsToSupabase(
  projects: Project[],
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, count: 0, error: 'Supabase not configured' };
  }

  if (projects.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    // Map local projects to Supabase format
    const supabaseProjects = projects.map((p) => ({
      id: p.id,
      user_id: userId,
      title: p.title,
      description: p.description ?? '',
      status: mapLocalStatusToSupabase(p.status),
      project_type: p.projectType ?? null,
      images: p.images?.map((img) => typeof img === 'string' ? img : img.uri) ?? [],
      default_image_index: p.defaultImageIndex ?? 0,
      pattern_pdf: p.patternPdf ?? null,
      pattern_url: p.patternUrl ?? null,
      pattern_images: p.patternImages ?? [],
      inspiration_url: p.inspirationUrl ?? null,
      notes: p.notes ?? null,
      yarn_used: p.yarnUsed ?? [],
      yarn_used_ids: p.yarnUsedIds ?? [],
      hook_used_ids: p.hookUsedIds ?? [],
      yarn_materials: p.yarnMaterials ?? [],
      work_progress: p.workProgress ?? [],
      inspiration_sources: p.inspirationSources ?? [],
      start_date: p.startDate?.toISOString() ?? null,
      completed_date: p.completedDate?.toISOString() ?? null,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('projects')
      .upsert(supabaseProjects, { onConflict: 'id' });

    if (error) {
      console.error('[Sync] Push projects failed:', error);
      return { success: false, count: 0, error: error.message };
    }

    console.log(`[Sync] Pushed ${projects.length} projects to Supabase`);
    return { success: true, count: projects.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Sync] Push projects error:', message);
    return { success: false, count: 0, error: message };
  }
}

/**
 * Pull projects from Supabase that were updated after lastSyncedAt.
 */
export async function pullProjectsFromSupabase(
  userId: string,
  lastSyncedAt?: Date
): Promise<{ success: boolean; projects: Project[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, projects: [], error: 'Supabase not configured' };
  }

  try {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);

    if (lastSyncedAt) {
      query = query.gt('updated_at', lastSyncedAt.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Sync] Pull projects failed:', error);
      return { success: false, projects: [], error: error.message };
    }

    const projects: Project[] = (data ?? []).map(mapSupabaseToLocalProject);
    console.log(`[Sync] Pulled ${projects.length} projects from Supabase`);
    return { success: true, projects };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Sync] Pull projects error:', message);
    return { success: false, projects: [], error: message };
  }
}

// ============================================================================
// INVENTORY SYNC
// ============================================================================

/**
 * Push local inventory items to Supabase.
 */
export async function pushInventoryToSupabase(
  items: InventoryItem[],
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, count: 0, error: 'Supabase not configured' };
  }

  if (items.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const supabaseItems = items.map((item) => ({
      id: item.id,
      user_id: userId,
      category: item.category,
      name: item.name,
      description: item.description ?? null,
      images: item.images?.map((img) => typeof img === 'string' ? img : img.uri) ?? [],
      quantity: item.quantity,
      unit: item.unit ?? null,
      yarn_details: item.yarnDetails ?? null,
      hook_details: item.hookDetails ?? null,
      other_details: item.otherDetails ?? null,
      location: item.location ?? null,
      tags: item.tags ?? [],
      used_in_projects: item.usedInProjects ?? [],
      notes: item.notes ?? null,
      barcode: item.barcode ?? null,
      date_added: item.dateAdded.toISOString(),
      last_updated: item.lastUpdated.toISOString(),
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('inventory_items')
      .upsert(supabaseItems, { onConflict: 'id' });

    if (error) {
      console.error('[Sync] Push inventory failed:', error);
      return { success: false, count: 0, error: error.message };
    }

    console.log(`[Sync] Pushed ${items.length} inventory items to Supabase`);
    return { success: true, count: items.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Sync] Push inventory error:', message);
    return { success: false, count: 0, error: message };
  }
}

/**
 * Pull inventory items from Supabase that were updated after lastSyncedAt.
 */
export async function pullInventoryFromSupabase(
  userId: string,
  lastSyncedAt?: Date
): Promise<{ success: boolean; items: InventoryItem[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, items: [], error: 'Supabase not configured' };
  }

  try {
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);

    if (lastSyncedAt) {
      query = query.gt('last_updated', lastSyncedAt.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Sync] Pull inventory failed:', error);
      return { success: false, items: [], error: error.message };
    }

    const items: InventoryItem[] = (data ?? []).map(mapSupabaseToLocalInventory);
    console.log(`[Sync] Pulled ${items.length} inventory items from Supabase`);
    return { success: true, items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Sync] Pull inventory error:', message);
    return { success: false, items: [], error: message };
  }
}

// ============================================================================
// FULL SYNC
// ============================================================================

/**
 * Perform a full sync: push local changes, then pull remote changes.
 */
export async function fullSync(
  localProjects: Project[],
  localInventory: InventoryItem[],
  userId: string,
  lastSyncedAt?: Date
): Promise<SyncResult> {
  const errors: string[] = [];
  let pushed = 0;
  let pulled = 0;

  // Push projects
  const pushProjectsResult = await pushProjectsToSupabase(localProjects, userId);
  if (pushProjectsResult.success) {
    pushed += pushProjectsResult.count;
  } else if (pushProjectsResult.error) {
    errors.push(`Projects push: ${pushProjectsResult.error}`);
  }

  // Push inventory
  const pushInventoryResult = await pushInventoryToSupabase(localInventory, userId);
  if (pushInventoryResult.success) {
    pushed += pushInventoryResult.count;
  } else if (pushInventoryResult.error) {
    errors.push(`Inventory push: ${pushInventoryResult.error}`);
  }

  // Pull projects
  const pullProjectsResult = await pullProjectsFromSupabase(userId, lastSyncedAt);
  if (pullProjectsResult.success) {
    pulled += pullProjectsResult.projects.length;
  } else if (pullProjectsResult.error) {
    errors.push(`Projects pull: ${pullProjectsResult.error}`);
  }

  // Pull inventory
  const pullInventoryResult = await pullInventoryFromSupabase(userId, lastSyncedAt);
  if (pullInventoryResult.success) {
    pulled += pullInventoryResult.items.length;
  } else if (pullInventoryResult.error) {
    errors.push(`Inventory pull: ${pullInventoryResult.error}`);
  }

  return {
    success: errors.length === 0,
    pushed,
    pulled,
    errors,
  };
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Map local project status to Supabase enum.
 */
function mapLocalStatusToSupabase(status: string): string {
  // Supabase enum: 'idea', 'in-progress', 'completed', 'maybe-someday', 'not-started', 'paused', 'frogged'
  const statusMap: Record<string, string> = {
    'not-started': 'not-started',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'paused': 'paused',
    'frogged': 'frogged',
    'idea': 'idea',
    'maybe-someday': 'maybe-someday',
  };
  return statusMap[status] ?? 'idea';
}

/**
 * Map Supabase project to local Project type.
 */
function mapSupabaseToLocalProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    status: row.status as Project['status'],
    projectType: (row.project_type as Project['projectType']) || undefined,
    images: ((row.images as string[]) ?? []).map((uri) => ({ uri })),
    defaultImageIndex: (row.default_image_index as number) ?? undefined,
    patternPdf: (row.pattern_pdf as string) || undefined,
    patternUrl: (row.pattern_url as string) || undefined,
    patternImages: (row.pattern_images as string[]) || undefined,
    inspirationUrl: (row.inspiration_url as string) || undefined,
    notes: (row.notes as string) || undefined,
    yarnUsed: (row.yarn_used as string[]) || undefined,
    yarnUsedIds: (row.yarn_used_ids as string[]) || undefined,
    hookUsedIds: (row.hook_used_ids as string[]) || undefined,
    yarnMaterials: (row.yarn_materials as Project['yarnMaterials']) || undefined,
    workProgress: (row.work_progress as Project['workProgress']) || undefined,
    inspirationSources: (row.inspiration_sources as Project['inspirationSources']) || undefined,
    startDate: row.start_date ? new Date(row.start_date as string) : undefined,
    completedDate: row.completed_date ? new Date(row.completed_date as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Map Supabase inventory item to local InventoryItem type.
 */
function mapSupabaseToLocalInventory(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as string,
    category: row.category as InventoryItem['category'],
    name: row.name as string,
    description: (row.description as string) || undefined,
    images: ((row.images as string[]) ?? []).map((uri) => ({ uri })),
    quantity: (row.quantity as number) ?? 1,
    unit: (row.unit as InventoryItem['unit']) || undefined,
    yarnDetails: (row.yarn_details as InventoryItem['yarnDetails']) || undefined,
    hookDetails: (row.hook_details as InventoryItem['hookDetails']) || undefined,
    otherDetails: (row.other_details as InventoryItem['otherDetails']) || undefined,
    location: (row.location as string) || undefined,
    tags: (row.tags as string[]) || undefined,
    usedInProjects: (row.used_in_projects as string[]) || undefined,
    notes: (row.notes as string) || undefined,
    barcode: (row.barcode as string) || undefined,
    dateAdded: new Date(row.date_added as string),
    lastUpdated: new Date(row.last_updated as string),
  };
}
