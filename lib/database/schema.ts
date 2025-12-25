/**
 * SQLite Database Schema Types and Mappers
 *
 * Provides type-safe mapping between SQLite rows and TypeScript types.
 * JSON columns are used for complex nested objects.
 */

import type {
  Project,
  ProjectStatus,
  ProjectType,
  ProjectImage,
  ProjectYarn,
  WorkProgressEntry,
  InspirationSource,
  InventoryItem,
  YarnDetails,
  HookDetails,
  OtherDetails,
} from '@/types';

// ============================================================================
// PROJECT TABLE TYPES
// ============================================================================

/**
 * Raw row type as stored in SQLite projects table.
 * JSON fields are stored as TEXT.
 */
export interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  project_type: string | null;
  images: string | null; // JSON array
  default_image_index: number | null;
  pattern_pdf: string | null;
  pattern_url: string | null;
  pattern_images: string | null; // JSON array
  inspiration_url: string | null;
  notes: string | null;
  yarn_used: string | null; // JSON array
  yarn_used_ids: string | null; // JSON array
  hook_used_ids: string | null; // JSON array
  yarn_materials: string | null; // JSON array
  work_progress: string | null; // JSON array
  inspiration_sources: string | null; // JSON array
  start_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  pending_sync: number;
}

/**
 * Map SQLite row to Project type.
 */
export function mapRowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as ProjectStatus,
    projectType: (row.project_type as ProjectType) ?? undefined,
    images: parseJsonArray<ProjectImage>(row.images) ?? [],
    defaultImageIndex: row.default_image_index ?? undefined,
    patternPdf: row.pattern_pdf ?? undefined,
    patternUrl: row.pattern_url ?? undefined,
    patternImages: parseJsonArray<string>(row.pattern_images) ?? undefined,
    inspirationUrl: row.inspiration_url ?? undefined,
    notes: row.notes ?? undefined,
    yarnUsed: parseJsonArray<string>(row.yarn_used) ?? undefined,
    yarnUsedIds: parseJsonArray<string>(row.yarn_used_ids) ?? undefined,
    hookUsedIds: parseJsonArray<string>(row.hook_used_ids) ?? undefined,
    yarnMaterials: parseJsonArray<ProjectYarn>(row.yarn_materials) ?? undefined,
    workProgress: parseWorkProgress(row.work_progress),
    inspirationSources: parseJsonArray<InspirationSource>(row.inspiration_sources) ?? undefined,
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map Project type to SQLite row values for INSERT/UPDATE.
 */
export function mapProjectToRow(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Omit<ProjectRow, 'id' | 'created_at' | 'updated_at' | 'synced_at' | 'pending_sync'> {
  return {
    title: project.title,
    description: project.description ?? null,
    status: project.status,
    project_type: project.projectType ?? null,
    images: stringifyJson(project.images),
    default_image_index: project.defaultImageIndex ?? null,
    pattern_pdf: project.patternPdf ?? null,
    pattern_url: project.patternUrl ?? null,
    pattern_images: stringifyJson(project.patternImages),
    inspiration_url: project.inspirationUrl ?? null,
    notes: project.notes ?? null,
    yarn_used: stringifyJson(project.yarnUsed),
    yarn_used_ids: stringifyJson(project.yarnUsedIds),
    hook_used_ids: stringifyJson(project.hookUsedIds),
    yarn_materials: stringifyJson(project.yarnMaterials),
    work_progress: stringifyWorkProgress(project.workProgress),
    inspiration_sources: stringifyJson(project.inspirationSources),
    start_date: project.startDate?.toISOString() ?? null,
    completed_date: project.completedDate?.toISOString() ?? null,
  };
}

// ============================================================================
// INVENTORY ITEM TABLE TYPES
// ============================================================================

/**
 * Raw row type as stored in SQLite inventory_items table.
 */
export interface InventoryItemRow {
  id: string;
  category: string;
  name: string;
  description: string | null;
  images: string | null; // JSON array
  quantity: number;
  unit: string | null;
  yarn_details: string | null; // JSON object
  hook_details: string | null; // JSON object
  other_details: string | null; // JSON object
  location: string | null;
  tags: string | null; // JSON array
  used_in_projects: string | null; // JSON array
  notes: string | null;
  barcode: string | null;
  date_added: string;
  last_updated: string;
  synced_at: string | null;
  pending_sync: number;
}

/**
 * Map SQLite row to InventoryItem type.
 */
export function mapRowToInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    category: row.category as 'yarn' | 'hook' | 'other',
    name: row.name,
    description: row.description ?? undefined,
    images: parseJsonArray<ProjectImage>(row.images) ?? undefined,
    quantity: row.quantity,
    unit: row.unit as InventoryItem['unit'] ?? undefined,
    yarnDetails: parseJson<YarnDetails>(row.yarn_details),
    hookDetails: parseJson<HookDetails>(row.hook_details),
    otherDetails: parseJson<OtherDetails>(row.other_details),
    location: row.location ?? undefined,
    tags: parseJsonArray<string>(row.tags) ?? undefined,
    usedInProjects: parseJsonArray<string>(row.used_in_projects) ?? undefined,
    notes: row.notes ?? undefined,
    barcode: row.barcode ?? undefined,
    dateAdded: new Date(row.date_added),
    lastUpdated: new Date(row.last_updated),
  };
}

/**
 * Map InventoryItem type to SQLite row values for INSERT/UPDATE.
 */
export function mapInventoryItemToRow(
  item: Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>
): Omit<InventoryItemRow, 'id' | 'date_added' | 'last_updated' | 'synced_at' | 'pending_sync'> {
  return {
    category: item.category,
    name: item.name,
    description: item.description ?? null,
    images: stringifyJson(item.images),
    quantity: item.quantity,
    unit: item.unit ?? null,
    yarn_details: stringifyYarnDetails(item.yarnDetails),
    hook_details: stringifyHookDetails(item.hookDetails),
    other_details: stringifyJson(item.otherDetails),
    location: item.location ?? null,
    tags: stringifyJson(item.tags),
    used_in_projects: stringifyJson(item.usedInProjects),
    notes: item.notes ?? null,
    barcode: item.barcode ?? null,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely parse JSON string to typed array.
 */
function parseJsonArray<T>(json: string | null): T[] | undefined {
  if (!json) return undefined;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    console.warn('[SQLite] Failed to parse JSON array:', json);
    return undefined;
  }
}

/**
 * Safely parse JSON string to typed object.
 */
function parseJson<T>(json: string | null): T | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as T;
  } catch {
    console.warn('[SQLite] Failed to parse JSON:', json);
    return undefined;
  }
}

/**
 * Stringify value to JSON, handling undefined/null.
 */
function stringifyJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value) && value.length === 0) return null;
  try {
    return JSON.stringify(value);
  } catch {
    console.warn('[SQLite] Failed to stringify:', value);
    return null;
  }
}

/**
 * Parse work progress entries, converting date strings to Date objects.
 */
function parseWorkProgress(json: string | null): WorkProgressEntry[] | undefined {
  const entries = parseJsonArray<WorkProgressEntry>(json);
  if (!entries) return undefined;
  return entries.map((entry) => ({
    ...entry,
    date: new Date(entry.date),
  }));
}

/**
 * Stringify work progress entries.
 */
function stringifyWorkProgress(entries: WorkProgressEntry[] | undefined): string | null {
  if (!entries || entries.length === 0) return null;
  return JSON.stringify(entries);
}

/**
 * Stringify YarnDetails, converting Date objects to ISO strings.
 */
function stringifyYarnDetails(details: YarnDetails | undefined): string | null {
  if (!details) return null;
  const serialized = {
    ...details,
    purchaseDate: details.purchaseDate?.toISOString?.() ?? details.purchaseDate,
  };
  return JSON.stringify(serialized);
}

/**
 * Stringify HookDetails, converting Date objects to ISO strings.
 */
function stringifyHookDetails(details: HookDetails | undefined): string | null {
  if (!details) return null;
  const serialized = {
    ...details,
    purchaseDate: details.purchaseDate?.toISOString?.() ?? details.purchaseDate,
  };
  return JSON.stringify(serialized);
}

// ============================================================================
// UUID GENERATION
// ============================================================================

/**
 * Generate a unique ID for new records.
 * Uses crypto.randomUUID if available, falls back to timestamp-based ID.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get current ISO timestamp.
 */
export function now(): string {
  return new Date().toISOString();
}
