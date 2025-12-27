/**
 * Legend-State Data Mappers
 * 
 * Maps between the raw JSON row format (stored in Legend-State/AsyncStorage)
 * and the Domain Objects used by the UI.
 */

import { Project, InventoryItem, ProjectYarn, ProjectStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES (Simulating the old DB Schema Row)
// ============================================================================

export interface ProjectRow {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  project_type: string;
  images: string; // JSON string
  default_image_index: number;
  pattern_pdf: string;
  pattern_url: string;
  pattern_images: string; // JSON string
  inspiration_url: string;
  notes: string;
  yarn_used: string; // JSON string
  yarn_used_ids: string; // JSON string
  hook_used_ids: string; // JSON string
  yarn_materials: string; // JSON string
  work_progress: string; // JSON string
  inspiration_sources: string; // JSON string
  start_date: string;
  completed_date: string;
  created_at: string;
  updated_at: string;
  pending_sync: number;
  user_id: string | null;
  currently_working_on: number;
  currently_working_on_at: string;
  currently_working_on_ended_at: string;
  deleted: number;
}

export interface InventoryItemRow {
  id: string;
  category: InventoryItem['category'];
  name: string;
  description: string;
  images: string; // JSON string
  quantity: number;
  unit: string;
  yarn_details: string; // JSON string
  hook_details: string; // JSON string
  other_details: string; // JSON string
  location: string;
  tags: string; // JSON string
  used_in_projects: string; // JSON string
  notes: string;
  barcode: string;
  date_added: string;
  last_updated: string;
  pending_sync: number;
  user_id: string | null;
  deleted: number;
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

function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function safeJsonStringify(data: any): string {
  return JSON.stringify(data || null);
}

// ============================================================================
// PROJECT MAPPERS
// ============================================================================

export function mapRowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as ProjectStatus,
    projectType: row.project_type as Project['projectType'],
    images: safeJsonParse(row.images, []),
    defaultImageIndex: row.default_image_index,
    patternPdf: row.pattern_pdf,
    patternUrl: row.pattern_url,
    patternImages: safeJsonParse(row.pattern_images, []),
    inspirationUrl: row.inspiration_url,
    notes: row.notes,
    yarnUsed: safeJsonParse(row.yarn_used, []),
    yarnUsedIds: safeJsonParse(row.yarn_used_ids, []),
    hookUsedIds: safeJsonParse(row.hook_used_ids, []),
    yarnMaterials: safeJsonParse(row.yarn_materials, []),
    workProgress: safeJsonParse(row.work_progress, []).map((wp: any) => ({
      ...wp,
      date: new Date(wp.date),
    })),
    inspirationSources: safeJsonParse(row.inspiration_sources, []),
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    isCurrentlyWorkingOn: row.currently_working_on === 1,
    currentlyWorkingOnAt: row.currently_working_on_at || undefined,
    currentlyWorkingOnEndedAt: row.currently_working_on_ended_at || undefined,
  };
}

export function mapProjectToRow(project: Project): Partial<ProjectRow> {
  return {
    id: project.id,
    title: project.title,
    description: project.description || '',
    status: project.status,
    project_type: project.projectType || '',
    images: safeJsonStringify(project.images),
    default_image_index: project.defaultImageIndex || 0,
    pattern_pdf: project.patternPdf || '',
    pattern_url: project.patternUrl || '',
    pattern_images: safeJsonStringify(project.patternImages),
    inspiration_url: project.inspirationUrl || '',
    notes: project.notes || '',
    yarn_used: safeJsonStringify(project.yarnUsed),
    yarn_used_ids: safeJsonStringify(project.yarnUsedIds),
    hook_used_ids: safeJsonStringify(project.hookUsedIds),
    yarn_materials: safeJsonStringify(project.yarnMaterials),
    work_progress: safeJsonStringify(project.workProgress),
    inspiration_sources: safeJsonStringify(project.inspirationSources),
    start_date: project.startDate?.toISOString() || null as any,
    completed_date: project.completedDate?.toISOString() || null as any,
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
    currently_working_on: project.isCurrentlyWorkingOn ? 1 : 0,
    currently_working_on_at: project.currentlyWorkingOnAt || null as any,
    currently_working_on_ended_at: project.currentlyWorkingOnEndedAt || null as any,
  };
}

// ============================================================================
// INVENTORY MAPPERS
// ============================================================================

export function mapRowToInventoryItem(row: InventoryItemRow): InventoryItem {
  // Parse yarn details with Date conversion
  const parseYarnDetails = () => {
    if (!row.yarn_details) return undefined;
    const parsed = safeJsonParse<any>(row.yarn_details, null);
    if (!parsed) return undefined;
    return {
      ...parsed,
      purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : undefined,
    };
  };

  // Parse hook details with Date conversion
  const parseHookDetails = () => {
    if (!row.hook_details) return undefined;
    const parsed = safeJsonParse<any>(row.hook_details, null);
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
    images: safeJsonParse(row.images, []),
    quantity: row.quantity,
    unit: row.unit as InventoryItem['unit'],
    yarnDetails: parseYarnDetails(),
    hookDetails: parseHookDetails(),
    otherDetails: safeJsonParse(row.other_details, undefined),
    location: row.location,
    tags: safeJsonParse(row.tags, []),
    usedInProjects: safeJsonParse(row.used_in_projects, []),
    notes: row.notes,
    barcode: row.barcode,
    dateAdded: new Date(row.date_added),
    lastUpdated: new Date(row.last_updated),
  };
}

export function mapInventoryItemToRow(item: InventoryItem): Partial<InventoryItemRow> {
  return {
    id: item.id,
    category: item.category,
    name: item.name,
    description: item.description || '',
    images: safeJsonStringify(item.images),
    quantity: item.quantity,
    unit: item.unit || '',
    yarn_details: safeJsonStringify(item.yarnDetails),
    hook_details: safeJsonStringify(item.hookDetails),
    other_details: safeJsonStringify(item.otherDetails),
    location: item.location || '',
    tags: safeJsonStringify(item.tags),
    used_in_projects: safeJsonStringify(item.usedInProjects),
    notes: item.notes || '',
    barcode: item.barcode || '',
    date_added: item.dateAdded.toISOString(),
    last_updated: item.lastUpdated.toISOString(),
  };
}


