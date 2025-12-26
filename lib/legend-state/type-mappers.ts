/**
 * Type Mappers for Legend-State Sync
 *
 * Converts between local SQLite/TypeScript types and Supabase cloud types.
 * Since schemas are now aligned (SQLite = source of truth), mappings are minimal:
 * - Add user_id, synced_at, deleted for cloud
 * - Convert Date objects ↔ ISO strings
 *
 * @see lib/database/schema.ts for local types
 * @see lib/supabase/database.types.ts for cloud types (now aligned with SQLite)
 */

import type { Project as LocalProject, InventoryItem as LocalInventoryItem } from '@/types';
import type { Project as CloudProject, InventoryItem as CloudInventoryItem } from '@/lib/supabase/database.types';

// ============================================================================
// PROJECT MAPPERS
// ============================================================================

/**
 * Convert local Project to Supabase Project format.
 * Schemas are aligned - only need to add cloud-specific fields and convert dates.
 */
export function mapLocalProjectToCloud(project: LocalProject, userId: string): CloudProject {
  return {
    id: project.id,
    user_id: userId,
    title: project.title,
    description: project.description || '',
    status: project.status, // Same enum values now
    project_type: project.projectType || null,
    images: project.images?.map(img => typeof img === 'string' ? img : String(img)) || [],
    default_image_index: project.defaultImageIndex ?? null,
    pattern_pdf: project.patternPdf || null,
    pattern_url: project.patternUrl || null,
    pattern_images: project.patternImages || null,
    inspiration_url: project.inspirationUrl || null,
    notes: project.notes || null,
    yarn_used: project.yarnUsed || [],
    yarn_used_ids: project.yarnUsedIds || null,
    hook_used_ids: project.hookUsedIds || null,
    yarn_materials: project.yarnMaterials ? JSON.parse(JSON.stringify(project.yarnMaterials)) : null,
    work_progress: project.workProgress ? JSON.parse(JSON.stringify(project.workProgress)) : null,
    inspiration_sources: project.inspirationSources ? JSON.parse(JSON.stringify(project.inspirationSources)) : null,
    start_date: project.startDate?.toISOString() || null,
    completed_date: project.completedDate?.toISOString() || null,
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
    synced_at: new Date().toISOString(),
    deleted: false,
  };
}

/**
 * Convert Supabase Project to local Project format.
 * Schemas are aligned - only need to convert date strings to Date objects.
 */
export function mapCloudProjectToLocal(project: CloudProject): LocalProject {
  return {
    id: project.id,
    title: project.title,
    description: project.description || undefined,
    status: project.status, // Same enum values now
    projectType: project.project_type as LocalProject['projectType'] || undefined,
    images: project.images || [],
    defaultImageIndex: project.default_image_index ?? undefined,
    patternPdf: project.pattern_pdf || undefined,
    patternUrl: project.pattern_url || undefined,
    patternImages: project.pattern_images || undefined,
    inspirationUrl: project.inspiration_url || undefined,
    notes: project.notes || undefined,
    yarnUsed: project.yarn_used || undefined,
    yarnUsedIds: project.yarn_used_ids || undefined,
    hookUsedIds: project.hook_used_ids || undefined,
    yarnMaterials: project.yarn_materials as unknown as LocalProject['yarnMaterials'] || undefined,
    workProgress: project.work_progress
      ? (project.work_progress as unknown as { date: string; notes: string; id: string }[]).map((entry) => ({
          ...entry,
          date: new Date(entry.date),
        })) as LocalProject['workProgress']
      : undefined,
    inspirationSources: project.inspiration_sources as unknown as LocalProject['inspirationSources'] || undefined,
    startDate: project.start_date ? new Date(project.start_date) : undefined,
    completedDate: project.completed_date ? new Date(project.completed_date) : undefined,
    createdAt: new Date(project.created_at),
    updatedAt: new Date(project.updated_at),
  };
}

// ============================================================================
// INVENTORY MAPPERS
// ============================================================================

/**
 * Convert local InventoryItem to Supabase InventoryItem format.
 * Schemas are aligned - field names match (name, other_details).
 */
export function mapLocalInventoryToCloud(item: LocalInventoryItem, userId: string): CloudInventoryItem {
  return {
    id: item.id,
    user_id: userId,
    category: item.category, // Same enum values now
    name: item.name, // Same field name now
    description: item.description || '',
    images: item.images?.map(img => typeof img === 'string' ? img : String(img)) || [],
    quantity: item.quantity,
    unit: item.unit || null,
    location: item.location || null,
    tags: item.tags || [],
    used_in_projects: item.usedInProjects || [],
    notes: item.notes || null,
    barcode: item.barcode || null,
    date_added: item.dateAdded.toISOString(),
    last_updated: item.lastUpdated.toISOString(),
    yarn_details: item.yarnDetails ? JSON.parse(JSON.stringify(item.yarnDetails)) : null,
    hook_details: item.hookDetails ? JSON.parse(JSON.stringify(item.hookDetails)) : null,
    other_details: item.otherDetails ? JSON.parse(JSON.stringify(item.otherDetails)) : null, // Same field name now
    synced_at: new Date().toISOString(),
    deleted: false,
  };
}

/**
 * Convert Supabase InventoryItem to local InventoryItem format.
 * Schemas are aligned - field names match (name, other_details).
 */
export function mapCloudInventoryToLocal(item: CloudInventoryItem): LocalInventoryItem {
  return {
    id: item.id,
    category: item.category, // Same enum values now
    name: item.name, // Same field name now
    description: item.description || undefined,
    images: item.images || undefined,
    quantity: item.quantity,
    unit: item.unit as LocalInventoryItem['unit'] || undefined,
    location: item.location || undefined,
    tags: item.tags || undefined,
    usedInProjects: item.used_in_projects || undefined,
    notes: item.notes || undefined,
    barcode: item.barcode || undefined,
    dateAdded: new Date(item.date_added),
    lastUpdated: new Date(item.last_updated),
    yarnDetails: item.yarn_details as unknown as LocalInventoryItem['yarnDetails'] || undefined,
    hookDetails: item.hook_details as unknown as LocalInventoryItem['hookDetails'] || undefined,
    otherDetails: item.other_details as unknown as LocalInventoryItem['otherDetails'] || undefined, // Same field name now
  };
}
