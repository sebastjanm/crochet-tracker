/**
 * Projects Context with SQLite Storage
 *
 * Provides project CRUD operations with offline-first SQLite persistence.
 * Uses useSQLiteContext from expo-sqlite for database access.
 * Pro users get automatic cloud sync via Supabase.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/sqlite/
 */

import createContextHook from '@nkzw/create-context-hook';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStatus, ProjectYarn } from '@/types';
import { syncProjectMaterials, removeProjectFromInventory } from '@/lib/cross-context-sync';
import { debouncedSync } from '@/lib/cloud-sync';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/auth-context';
import {
  ProjectRow,
  mapRowToProject,
  mapProjectToRow,
  generateId,
  now,
} from '@/lib/database/schema';

export const [ProjectsProvider, useProjects] = createContextHook(() => {
  const db = useSQLiteContext();
  const { user, isPro } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Trigger cloud sync for Pro users (debounced).
   */
  const triggerSync = useCallback(() => {
    if (isPro && user?.id) {
      debouncedSync(db, user.id);
    }
  }, [db, isPro, user?.id]);

  /**
   * Load all projects from SQLite database.
   */
  const loadProjects = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<ProjectRow>(
        'SELECT * FROM projects ORDER BY updated_at DESC'
      );

      const loadedProjects = rows.map((row) => {
        const project = mapRowToProject(row);

        // Migration: convert yarnUsedIds to yarnMaterials with quantity
        let yarnMaterials: ProjectYarn[] | undefined = project.yarnMaterials;
        if (!yarnMaterials && project.yarnUsedIds && project.yarnUsedIds.length > 0) {
          yarnMaterials = project.yarnUsedIds.map((id: string) => ({
            itemId: id,
            quantity: 1, // Default to 1 for legacy data
          }));
        }

        return {
          ...project,
          yarnMaterials,
        };
      });

      setProjects(loadedProjects);
      console.log(`[Projects] Loaded ${loadedProjects.length} projects from SQLite`);
    } catch (error) {
      console.error('[Projects] Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /**
   * Add a new project to the database.
   */
  const addProject = async (
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> => {
    const id = generateId();
    const timestamp = now();
    const row = mapProjectToRow(project);

    await db.runAsync(
      `INSERT INTO projects (
        id, title, description, status, project_type, images, default_image_index,
        pattern_pdf, pattern_url, pattern_images, inspiration_url, notes,
        yarn_used, yarn_used_ids, hook_used_ids, yarn_materials, work_progress,
        inspiration_sources, start_date, completed_date, created_at, updated_at, pending_sync, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        row.title,
        row.description,
        row.status,
        row.project_type,
        row.images,
        row.default_image_index,
        row.pattern_pdf,
        row.pattern_url,
        row.pattern_images,
        row.inspiration_url,
        row.notes,
        row.yarn_used,
        row.yarn_used_ids,
        row.hook_used_ids,
        row.yarn_materials,
        row.work_progress,
        row.inspiration_sources,
        row.start_date,
        row.completed_date,
        timestamp,
        timestamp,
        1, // pending_sync = true for new projects
        user?.id ?? null, // Associate with current user
      ]
    );

    const newProject: Project = {
      ...project,
      id,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
    };

    setProjects((prev) => [newProject, ...prev]);
    console.log(`[Projects] Added project: ${newProject.title}`);

    // Trigger cloud sync for Pro users
    triggerSync();

    return newProject;
  };

  /**
   * Update an existing project.
   */
  const updateProject = async (id: string, updates: Partial<Project>) => {
    const existingProject = projects.find((p) => p.id === id);
    if (!existingProject) {
      console.error(`[Projects] Project ${id} not found`);
      return;
    }

    // Extract yarn IDs from yarnMaterials for sync
    const getYarnIds = (materials?: ProjectYarn[]) => materials?.map((m) => m.itemId) ?? [];
    const newYarnIds = updates.yarnMaterials
      ? getYarnIds(updates.yarnMaterials)
      : updates.yarnUsedIds ?? existingProject.yarnUsedIds ?? [];
    const oldYarnIds =
      getYarnIds(existingProject.yarnMaterials) || existingProject.yarnUsedIds || [];

    // Sync inventory items if material IDs are being updated
    const hasYarnChanges = updates.yarnMaterials !== undefined || updates.yarnUsedIds !== undefined;
    const hasHookChanges = updates.hookUsedIds !== undefined;

    if (hasYarnChanges || hasHookChanges) {
      try {
        await syncProjectMaterials(
          id,
          newYarnIds,
          updates.hookUsedIds ?? existingProject.hookUsedIds ?? [],
          oldYarnIds,
          existingProject.hookUsedIds ?? []
        );
        console.log('[Projects] Inventory items synced with project materials');
      } catch (error) {
        console.error('[Projects] Failed to sync inventory items:', error);
        // Continue with project update even if sync fails
      }
    }

    // Build the updated project
    const updatedProject: Project = {
      ...existingProject,
      ...updates,
      updatedAt: new Date(),
    };

    // Auto-set completedDate when status changes to 'completed'
    if (updates.status === 'completed' && existingProject.status !== 'completed') {
      updatedProject.completedDate = new Date();
    }
    // Clear completedDate if status changes away from 'completed'
    else if (
      updates.status &&
      updates.status !== 'completed' &&
      existingProject.status === 'completed'
    ) {
      updatedProject.completedDate = undefined;
    }

    // Update state first (optimistic update)
    setProjects((prev) => prev.map((p) => (p.id === id ? updatedProject : p)));

    // Build update query dynamically
    const row = mapProjectToRow(updatedProject);
    const timestamp = now();

    try {
      await db.runAsync(
        `UPDATE projects SET
          title = ?, description = ?, status = ?, project_type = ?, images = ?,
          default_image_index = ?, pattern_pdf = ?, pattern_url = ?, pattern_images = ?,
          inspiration_url = ?, notes = ?, yarn_used = ?, yarn_used_ids = ?, hook_used_ids = ?,
          yarn_materials = ?, work_progress = ?, inspiration_sources = ?, start_date = ?,
          completed_date = ?, updated_at = ?, pending_sync = ?
        WHERE id = ?`,
        [
          row.title,
          row.description,
          row.status,
          row.project_type,
          row.images,
          row.default_image_index,
          row.pattern_pdf,
          row.pattern_url,
          row.pattern_images,
          row.inspiration_url,
          row.notes,
          row.yarn_used,
          row.yarn_used_ids,
          row.hook_used_ids,
          row.yarn_materials,
          row.work_progress,
          row.inspiration_sources,
          row.start_date,
          row.completed_date,
          timestamp,
          1, // pending_sync = true
          id,
        ]
      );

      console.log(`[Projects] Updated project: ${id}`);

      // Trigger cloud sync for Pro users
      triggerSync();
    } catch (error) {
      // If save fails, revert the state
      console.error(`[Projects] Failed to update project ${id}:`, error);
      setProjects((prev) => prev.map((p) => (p.id === id ? existingProject : p)));
      throw error;
    }
  };

  /**
   * Delete a project from the database.
   */
  const deleteProject = async (id: string) => {
    // First, clean up inventory references
    try {
      await removeProjectFromInventory(id);
      console.log('[Projects] Inventory items cleaned up after project deletion');
    } catch (error) {
      console.error('[Projects] Failed to clean up inventory references:', error);
      // Continue with deletion even if cleanup fails
    }

    // Optimistic update
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      await db.runAsync('DELETE FROM projects WHERE id = ?', [id]);
      console.log(`[Projects] Deleted project: ${id}`);

      // Delete from cloud for Pro users
      if (isPro && isSupabaseConfigured() && supabase) {
        try {
          await supabase.from('projects').delete().eq('id', id);
          console.log(`[Projects] Deleted from cloud: ${id}`);
        } catch (cloudError) {
          console.error('[Projects] Failed to delete from cloud:', cloudError);
          // Don't throw - local delete succeeded
        }
      }
    } catch (error) {
      console.error(`[Projects] Failed to delete project ${id}:`, error);
      // Reload to restore state
      await loadProjects();
      throw error;
    }
  };

  /**
   * Get a single project by ID.
   */
  const getProjectById = (id: string): Project | undefined => {
    const project = projects.find((p) => p.id === id);
    return project;
  };

  /**
   * Get all projects with a specific status.
   */
  const getProjectsByStatus = (status: ProjectStatus): Project[] => {
    return projects.filter((p) => p.status === status);
  };

  /**
   * Refresh projects from database.
   */
  const refreshProjects = async () => {
    await loadProjects();
    console.log('[Projects] Refreshed from SQLite');
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByStatus,
    refreshProjects,
    toDoCount: projects.filter((p) => p.status === 'to-do').length,
    inProgressCount: projects.filter((p) => p.status === 'in-progress').length,
    onHoldCount: projects.filter((p) => p.status === 'on-hold').length,
    completedCount: projects.filter((p) => p.status === 'completed').length,
    froggedCount: projects.filter((p) => p.status === 'frogged').length,
  };
});
