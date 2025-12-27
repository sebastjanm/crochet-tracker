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
import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, ProjectStatus, ProjectYarn } from '@/types';
import { syncProjectMaterials, removeProjectFromInventory } from '@/lib/cross-context-sync';
import { getStores, updateProject as updateLegendProject, deleteProject as deleteLegendProject } from '@/lib/legend-state/config';
import { supabase } from '@/lib/supabase/client';
import { mapLocalProjectToCloud, replaceImageUri } from '@/lib/legend-state/type-mappers';
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

  // Legend-State stores reference for Pro users
  const storesRef = useRef<{ projects$: ReturnType<typeof getStores>['projects$'] } | null>(null);

  // Initialize Legend-State stores for Pro users
  useEffect(() => {
    if (isPro && user?.id) {
      const stores = getStores(user.id);
      storesRef.current = { projects$: stores.projects$ };
      console.log('[Projects] Legend-State stores initialized for Pro user');
    } else {
      storesRef.current = null;
    }
  }, [isPro, user?.id]);

  /**
   * Push project to cloud via Legend-State (Pro users only).
   * SQLite remains the source of truth - this syncs to cloud.
   */
  const pushToCloud = useCallback((project: Project) => {
    if (!isPro || !user?.id) {
      console.log('[Projects] Skipping cloud push - not Pro or no user');
      return;
    }

    const projects$ = storesRef.current?.projects$;
    if (!projects$) {
      console.warn('[Projects] Legend-State stores not initialized');
      return;
    }

    try {
      // Convert local project to cloud format and push to Legend-State
      const cloudProject = mapLocalProjectToCloud(project, user.id);

      // Write to Legend-State observable (auto-syncs to Supabase)
      projects$[project.id].assign(cloudProject);

      console.log('[Projects] Pushed to cloud via Legend-State:', project.id);
    } catch (error) {
      console.error('[Projects] Failed to push to cloud:', error);
      // SQLite still has the data - cloud sync will retry
    }
  }, [isPro, user?.id]);

  /**
   * Load projects from SQLite database filtered by current user.
   * Only loads non-deleted projects belonging to the current user.
   */
  const loadProjects = useCallback(async () => {
    // If no user is logged in, clear projects and return
    if (!user?.id) {
      console.log('[Projects] No user logged in, clearing projects');
      setProjects([]);
      setIsLoading(false);
      return;
    }

    try {
      // Filter by user_id and exclude deleted records
      // Also include records with NULL user_id (legacy/orphaned data that belongs to this device)
      const rows = await db.getAllAsync<ProjectRow>(
        `SELECT * FROM projects
         WHERE (user_id = ? OR user_id IS NULL)
         AND deleted = 0
         ORDER BY updated_at DESC`,
        [user.id]
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
      console.log(`[Projects] Loaded ${loadedProjects.length} projects from SQLite for user ${user.id}`);
    } catch (error) {
      console.error('[Projects] Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [db, user?.id]);

  // Reload projects when user changes (login/logout)
  useEffect(() => {
    console.log('[Projects] User changed, reloading projects');
    setIsLoading(true);
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
        inspiration_sources, start_date, completed_date, created_at, updated_at, pending_sync, user_id,
        currently_working_on, currently_working_on_at, currently_working_on_ended_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        row.currently_working_on,
        row.currently_working_on_at,
        row.currently_working_on_ended_at,
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

    // Push to cloud via Legend-State (Pro users only)
    pushToCloud(newProject);

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
          completed_date = ?, updated_at = ?, pending_sync = ?,
          currently_working_on = ?, currently_working_on_at = ?, currently_working_on_ended_at = ?
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
          row.currently_working_on,
          row.currently_working_on_at,
          row.currently_working_on_ended_at,
          id,
        ]
      );

      console.log(`[Projects] Updated project: ${id}`);

      // Push to cloud via Legend-State (Pro users only)
      pushToCloud(updatedProject);
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

      // Soft delete in cloud (Pro users only)
      // Try Legend-State first, fall back to direct Supabase if item not in observable
      if (isPro && user?.id) {
        try {
          let cloudDeleted = false;

          // Try Legend-State if store is available
          if (storesRef.current?.projects$) {
            cloudDeleted = deleteLegendProject(storesRef.current.projects$, id);
            if (cloudDeleted) {
              console.log(`[Projects] Soft deleted in cloud via Legend-State: ${id}`);
            }
          }

          // Fall back to direct Supabase if Legend-State didn't have the item
          if (!cloudDeleted && supabase) {
            console.log(`[Projects] Falling back to direct Supabase soft delete: ${id}`);
            const { error } = await supabase
              .from('projects')
              .update({
                deleted: true,
                updated_at: new Date().toISOString(),
              } as never)
              .eq('id', id)
              .eq('user_id', user.id);

            if (error) {
              console.error('[Projects] Supabase soft delete failed:', error);
            } else {
              console.log(`[Projects] Soft deleted in Supabase directly: ${id}`);
            }
          }
        } catch (error) {
          console.error('[Projects] Failed to soft delete in cloud:', error);
          // Local deletion succeeded - cloud sync will catch up
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

  /**
   * Get projects marked as "Currently Working On".
   * Maximum 3 projects can be active at once.
   */
  const currentlyWorkingOnProjects = projects.filter(
    (p) => p.isCurrentlyWorkingOn === true
  );

  /**
   * Toggle "Currently Working On" status for a project.
   * Enforces maximum of 3 active projects.
   *
   * @param projectId - ID of the project to toggle
   * @returns true if toggle was successful, false if limit reached
   */
  const toggleCurrentlyWorkingOn = async (projectId: string): Promise<boolean> => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      console.error(`[Projects] Project ${projectId} not found`);
      return false;
    }

    const isCurrentlyActive = project.isCurrentlyWorkingOn === true;
    const activeCount = currentlyWorkingOnProjects.length;

    // Check limit when trying to mark as active
    if (!isCurrentlyActive && activeCount >= 3) {
      console.warn('[Projects] Cannot mark more than 3 projects as Currently Working On');
      return false;
    }

    const timestamp = new Date().toISOString();

    // Build updates based on toggle direction
    const updates: Partial<Project> = isCurrentlyActive
      ? {
          // Unmarking: set ended timestamp
          isCurrentlyWorkingOn: false,
          currentlyWorkingOnEndedAt: timestamp,
        }
      : {
          // Marking: set started timestamp, clear ended
          isCurrentlyWorkingOn: true,
          currentlyWorkingOnAt: timestamp,
          currentlyWorkingOnEndedAt: undefined,
        };

    await updateProject(projectId, updates);
    console.log(
      `[Projects] ${isCurrentlyActive ? 'Removed from' : 'Added to'} Currently Working On: ${project.title}`
    );

    return true;
  };

  /**
   * Replace a local image URI with a cloud URL after upload.
   * Called by the image sync queue when an upload completes.
   *
   * IMPORTANT: This function queries SQLite directly instead of using the
   * in-memory `projects` state to avoid stale closure issues when called
   * from background callbacks.
   */
  const replaceProjectImage = useCallback(async (
    projectId: string,
    oldUri: string,
    newUrl: string
  ): Promise<void> => {
    console.log(`[Projects] replaceProjectImage called:`, {
      projectId,
      oldUri: oldUri.slice(-50),
      newUrl: newUrl.slice(0, 50),
    });

    try {
      // Query SQLite directly for fresh data (avoids stale closure issues)
      const row = await db.getFirstAsync<ProjectRow>(
        'SELECT * FROM projects WHERE id = ?',
        [projectId]
      );

      if (!row) {
        console.warn(`[Projects] replaceProjectImage: Project ${projectId} not found in SQLite`);
        return;
      }

      const project = mapRowToProject(row);
      const images = project.images || [];
      const updatedImages = replaceImageUri(images, oldUri, newUrl);

      // Check if any replacement was made
      if (JSON.stringify(images) === JSON.stringify(updatedImages)) {
        console.warn(`[Projects] replaceProjectImage: URI ${oldUri} not found in project ${projectId}`);
        console.log(`[Projects] Current images:`, images.map((img) =>
          typeof img === 'string' ? img.slice(-40) : JSON.stringify(img).slice(-40)
        ));
        return;
      }

      // Direct SQLite update for image replacement (faster, avoids full project update)
      const timestamp = now();
      await db.runAsync(
        'UPDATE projects SET images = ?, updated_at = ?, pending_sync = 1 WHERE id = ?',
        [JSON.stringify(updatedImages), timestamp, projectId]
      );

      // Update in-memory state
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, images: updatedImages, updatedAt: new Date(timestamp) }
            : p
        )
      );

      console.log(`[Projects] Replaced image URI in project ${projectId}: ${oldUri.slice(-30)} → ${newUrl.slice(0, 50)}`);

      // NOTE: We intentionally do NOT push to cloud here.
      // Pushing immediately after each image replacement causes a race condition:
      // 1. Image 1 uploads → we push (with only image 1's cloud URL)
      // 2. Sync pulls from cloud → overwrites SQLite with partial data
      // 3. Image 2 uploads → can't find its local URI (it was overwritten)
      //
      // Instead, the cloud URL will be synced on the next regular sync cycle,
      // after all pending images are uploaded.
    } catch (error) {
      console.error(`[Projects] replaceProjectImage failed:`, error);
    }
  }, [db]);

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByStatus,
    refreshProjects,
    replaceProjectImage,
    // Currently Working On
    currentlyWorkingOnProjects,
    toggleCurrentlyWorkingOn,
    // Status counts
    toDoCount: projects.filter((p) => p.status === 'to-do').length,
    inProgressCount: projects.filter((p) => p.status === 'in-progress').length,
    onHoldCount: projects.filter((p) => p.status === 'on-hold').length,
    completedCount: projects.filter((p) => p.status === 'completed').length,
    froggedCount: projects.filter((p) => p.status === 'frogged').length,
  };
});
