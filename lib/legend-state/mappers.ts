/**
 * Legend-State Data Mappers
 *
 * Maps between the raw row format (stored in Legend-State/AsyncStorage/Supabase)
 * and the Domain Objects used by the UI.
 *
 * Schema conventions (Supabase best practices):
 * - UUID primary keys
 * - Standard timestamps: created_at, updated_at, deleted_at
 * - TEXT[] for simple string arrays, JSONB for complex objects
 * - Soft deletes via deleted_at timestamp (NULL = active)
 */

import {
  Project,
  InventoryItem,
  ProjectStatus,
  ProjectImage,
  WorkProgressEntry,
  YarnDetails,
  HookDetails,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES (Match Supabase schema exactly)
// ============================================================================

export interface ProjectRow {
  id: string;
  user_id: string | null;

  // Core fields
  title: string;
  description: string;
  status: ProjectStatus;
  project_type: string;

  // TEXT[] arrays (native PostgreSQL arrays)
  images: string[];
  pattern_images: string[];
  yarn_used: string[];
  yarn_used_ids: string[];
  hook_used_ids: string[];

  // JSONB fields (stored as JSON strings locally)
  yarn_materials: string;
  work_progress: string;
  inspiration_sources: string;

  // Scalar fields
  default_image_index: number;
  pattern_pdf: string;
  pattern_url: string;
  inspiration_url: string;
  notes: string;

  // Date fields
  start_date: string | null;
  completed_date: string | null;

  // Currently working on
  currently_working_on: boolean;
  currently_working_on_at: string | null;
  currently_working_on_ended_at: string | null;

  // Standard timestamps (unified)
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // NULL = active, timestamp = soft deleted
}

export interface InventoryItemRow {
  id: string;
  user_id: string | null;

  // Core fields
  category: InventoryItem['category'];
  name: string;
  description: string;
  quantity: number;
  unit: string;

  // TEXT[] arrays
  images: string[];
  tags: string[];
  used_in_projects: string[];

  // Location & identification
  location: string;
  barcode: string;
  notes: string;

  // JSONB fields
  yarn_details: string | null;
  hook_details: string | null;
  other_details: string | null;

  // Standard timestamps (unified - same as projects)
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

export function now(): string {
  return new Date().toISOString();
}

export function generateId(): string {
  return uuidv4();
}

/**
 * Safely parse JSON with fallback.
 * Handles: null/undefined, strings, and already-parsed objects.
 * In __DEV__ mode, logs errors when parsing fails.
 */
function safeJsonParse<T>(json: string | object | null | undefined, fallback: T): T {
  if (json === null || json === undefined) return fallback;

  // Already an object - return as-is
  if (typeof json === 'object') {
    return json as T;
  }

  // Must be a string - parse it
  if (typeof json !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(json);
  } catch (error) {
    if (__DEV__) {
      const preview = json.length > 200 ? json.slice(0, 200) + '...' : json;
      console.error(
        '🚨 [safeJsonParse] JSON PARSE ERROR - Fix the data source!',
        '\n  📄 Input:', preview,
        '\n  ❌ Error:', error instanceof Error ? error.message : String(error),
        '\n  ↩️  Using fallback:', JSON.stringify(fallback)
      );
    }
    return fallback;
  }
}

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data ?? null);
}

// ============================================================================
// PROJECT MAPPERS
// ============================================================================

export function mapRowToProject(row: ProjectRow): Project {
  // Helper to safely convert array-like data (handles both array and JSON string)
  const toStringArray = (data: string[] | string | null | undefined): string[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return safeJsonParse(data, []);
    return [];
  };

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as ProjectStatus,
    projectType: row.project_type as Project['projectType'],
    images: toStringArray(row.images),
    defaultImageIndex: row.default_image_index,
    patternPdf: row.pattern_pdf,
    patternUrl: row.pattern_url,
    patternImages: toStringArray(row.pattern_images),
    inspirationUrl: row.inspiration_url,
    notes: row.notes,
    yarnUsed: toStringArray(row.yarn_used),
    yarnUsedIds: toStringArray(row.yarn_used_ids),
    hookUsedIds: toStringArray(row.hook_used_ids),
    yarnMaterials: safeJsonParse(row.yarn_materials, []),
    workProgress: safeJsonParse<Array<Omit<WorkProgressEntry, 'date'> & { date: string }>>(
      row.work_progress,
      []
    ).map((wp) => ({
      ...wp,
      date: new Date(wp.date),
    })),
    inspirationSources: safeJsonParse(row.inspiration_sources, []),
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    // currently_working_on is now boolean (was integer 0/1)
    isCurrentlyWorkingOn: Boolean(row.currently_working_on),
    currentlyWorkingOnAt: row.currently_working_on_at || undefined,
    currentlyWorkingOnEndedAt: row.currently_working_on_ended_at || undefined,
  };
}

export function mapProjectToRow(project: Project): Partial<ProjectRow> {
  // Convert ProjectImage[] to string[] (extract URIs)
  const imagesToStrings = (imgs: ProjectImage[] | undefined): string[] => {
    if (!imgs) return [];
    return imgs.map(img => typeof img === 'string' ? img : ((img as { uri?: string })?.uri ?? '')).filter(Boolean);
  };

  return {
    id: project.id,
    title: project.title,
    description: project.description || '',
    status: project.status,
    project_type: project.projectType || '',
    // TEXT[] arrays - native PostgreSQL arrays
    images: imagesToStrings(project.images),
    pattern_images: imagesToStrings(project.patternImages || []),
    yarn_used: project.yarnUsed || [],
    yarn_used_ids: project.yarnUsedIds || [],
    hook_used_ids: project.hookUsedIds || [],
    // JSONB fields - keep as JSON strings
    yarn_materials: safeJsonStringify(project.yarnMaterials),
    work_progress: safeJsonStringify(project.workProgress),
    inspiration_sources: safeJsonStringify(project.inspirationSources),
    // Scalar fields
    default_image_index: project.defaultImageIndex || 0,
    pattern_pdf: project.patternPdf || '',
    pattern_url: project.patternUrl || '',
    inspiration_url: project.inspirationUrl || '',
    notes: project.notes || '',
    // Dates
    start_date: project.startDate?.toISOString() || null,
    completed_date: project.completedDate?.toISOString() || null,
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
    // Currently working on (boolean, not integer)
    currently_working_on: project.isCurrentlyWorkingOn || false,
    currently_working_on_at: project.currentlyWorkingOnAt || null,
    currently_working_on_ended_at: project.currentlyWorkingOnEndedAt || null,
  };
}

// ============================================================================
// INVENTORY MAPPERS
// ============================================================================

export function mapRowToInventoryItem(row: InventoryItemRow): InventoryItem {
  // Helper to safely convert array-like data (handles both array and JSON string)
  const toStringArray = (data: string[] | string | null | undefined): string[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return safeJsonParse(data, []);
    return [];
  };

  // Parse yarn details with Date conversion
  const parseYarnDetails = (): YarnDetails | undefined => {
    if (!row.yarn_details) return undefined;
    const parsed = safeJsonParse<Omit<YarnDetails, 'purchaseDate'> & { purchaseDate?: string }>(
      row.yarn_details,
      null as unknown as Omit<YarnDetails, 'purchaseDate'> & { purchaseDate?: string }
    );
    if (!parsed) return undefined;
    return {
      ...parsed,
      purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : undefined,
    };
  };

  // Parse hook details with Date conversion
  const parseHookDetails = (): HookDetails | undefined => {
    if (!row.hook_details) return undefined;
    const parsed = safeJsonParse<Omit<HookDetails, 'purchaseDate'> & { purchaseDate?: string }>(
      row.hook_details,
      null as unknown as Omit<HookDetails, 'purchaseDate'> & { purchaseDate?: string }
    );
    if (!parsed) return undefined;
    return {
      ...parsed,
      purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : undefined,
    };
  };

  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    images: toStringArray(row.images),
    quantity: row.quantity,
    unit: row.unit as InventoryItem['unit'],
    yarnDetails: parseYarnDetails(),
    hookDetails: parseHookDetails(),
    otherDetails: safeJsonParse(row.other_details, undefined),
    location: row.location,
    tags: toStringArray(row.tags),
    usedInProjects: toStringArray(row.used_in_projects),
    notes: row.notes,
    barcode: row.barcode,
    // Unified timestamps (now same as projects)
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapInventoryItemToRow(item: InventoryItem): Partial<InventoryItemRow> {
  // Convert ProjectImage[] to string[] (extract URIs)
  const imagesToStrings = (imgs: ProjectImage[] | undefined): string[] => {
    if (!imgs) return [];
    return imgs.map(img => typeof img === 'string' ? img : ((img as { uri?: string })?.uri ?? '')).filter(Boolean);
  };

  return {
    id: item.id,
    category: item.category,
    name: item.name,
    description: item.description || '',
    quantity: item.quantity,
    unit: item.unit || 'piece',
    // TEXT[] arrays - native PostgreSQL arrays
    images: imagesToStrings(item.images || []),
    tags: item.tags || [],
    used_in_projects: item.usedInProjects || [],
    // Location & identification
    location: item.location || '',
    barcode: item.barcode || '',
    notes: item.notes || '',
    // JSONB fields
    yarn_details: safeJsonStringify(item.yarnDetails),
    hook_details: safeJsonStringify(item.hookDetails),
    other_details: safeJsonStringify(item.otherDetails),
    // Unified timestamps
    created_at: item.createdAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
  };
}


