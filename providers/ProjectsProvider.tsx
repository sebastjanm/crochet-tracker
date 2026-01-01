/**
 * Projects Context (Legend-State Native)
 *
 * ARCHITECTURE:
 * - Source of Truth: Legend-State Observable (projects$)
 * - Persistence: AsyncStorage (handled by Legend-State)
 * - Sync: Supabase (handled by Legend-State)
 */

import { useCallback, useMemo, useEffect, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useSelector } from '@legendapp/state/react';
import { Project, ProjectStatus, ProjectYarn } from '@/types';
import { syncProjectMaterials, removeProjectFromInventory } from '@/lib/cross-context-sync';
import {
  getStores,
  addProject as addProjectToStore,
  updateProject as updateProjectInStore,
  deleteProject as deleteProjectFromStore,
  reconcileProjects,
} from '@/lib/legend-state/config';
import { useAuth } from '@/providers/AuthProvider';
import { useImageSync } from '@/hooks/useImageSync';
import {
  mapRowToProject,
  mapProjectToRow,
} from '@/lib/legend-state/mappers';

export const [ProjectsProvider, useProjects] = createContextHook(() => {
  const { user, isPro } = useAuth();
  const { queueProjectImages } = useImageSync();

  // Refresh counter - increment to force store re-initialization
  const [refreshKey, setRefreshKey] = useState(0);

  // Get the reactive store (re-fetches when refreshKey changes or user/isPro changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { projects$ } = useMemo(
    () => getStores(user?.id ?? null, isPro),
    [user?.id, isPro, refreshKey]
  );

  // Auto-reconciliation: detect orphaned projects on app start
  // This catches edge cases where data was modified directly in Supabase
  // Runs for ALL authenticated users (smart safety check protects never-synced users)
  useEffect(() => {
    if (!user?.id) return;

    // Wait for initial sync to complete before reconciling
    const timer = setTimeout(async () => {
      const result = await reconcileProjects(user.id, projects$);
      if (result.removed > 0 && __DEV__) {
        console.log(`[Projects] Reconciliation removed ${result.removed} orphaned projects`);
      }
    }, 2000); // 2s delay for initial sync

    return () => clearTimeout(timer);
  }, [user?.id, projects$]);

  // 2. Reactive Data Selector
  const projects = useSelector(() => {
    const projectsMap = projects$.get();
    if (!projectsMap) return [];

    return Object.values(projectsMap)
      // Soft delete: deleted_at is NULL for active, timestamp for deleted
      .filter((row: unknown) => {
        const r = row as { deleted_at?: string | null };
        return r.deleted_at === null || r.deleted_at === undefined;
      })
      .map((row: unknown) => {
        const project = mapRowToProject(row as Parameters<typeof mapRowToProject>[0]);
        let yarnMaterials: ProjectYarn[] | undefined = project.yarnMaterials;
        if (!yarnMaterials && project.yarnUsedIds && project.yarnUsedIds.length > 0) {
          yarnMaterials = project.yarnUsedIds.map((id: string) => ({
            itemId: id,
            quantity: 1,
          }));
        }
        return { ...project, yarnMaterials };
      })
      .sort((a: Project, b: Project) => b.updatedAt.getTime() - a.updatedAt.getTime());
  });

  const isLoading = false;

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  /** Add a new project to the store */
  const addProject = useCallback(async (
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> => {
    // 1. Map Domain -> Row
    const fullProject: Project = {
      ...project,
      id: 'temp',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const row = mapProjectToRow(fullProject);

    // 2. Add to Store
    const id = addProjectToStore(projects$, user?.id ?? null, row);

    // 3. Build final Project
    const newProject: Project = {
      ...project,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. Queue Images
    if (project.images?.length) {
      queueProjectImages(newProject);
    }

    return newProject;
  }, [projects$, user?.id, queueProjectImages]);

  /** Update an existing project */
  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const existingProject = projects.find((p: Project) => p.id === id);
    if (!existingProject) {
      if (__DEV__) console.error(`[Projects] Project ${id} not found`);
      return;
    }

    // Handle Inventory Sync
    const getYarnIds = (materials?: ProjectYarn[]) => materials?.map((m) => m.itemId) ?? [];
    const newYarnIds = updates.yarnMaterials
      ? getYarnIds(updates.yarnMaterials)
      : updates.yarnUsedIds ?? existingProject.yarnUsedIds ?? [];
    const oldYarnIds =
      getYarnIds(existingProject.yarnMaterials) || existingProject.yarnUsedIds || [];

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
      } catch (error) {
        if (__DEV__) console.error('[Projects] Failed to sync inventory items:', error);
      }
    }

    // Handle Status
    let completedDate = updates.completedDate ?? existingProject.completedDate;
    if (updates.status === 'completed' && existingProject.status !== 'completed') {
      completedDate = new Date();
    } else if (updates.status && updates.status !== 'completed' && existingProject.status === 'completed') {
      completedDate = undefined;
    }

    const mergedProject: Project = { ...existingProject, ...updates, completedDate, updatedAt: new Date() };
    const rowUpdates = mapProjectToRow(mergedProject);

    // Update Store
    updateProjectInStore(projects$, id, rowUpdates);

    // Queue Images (if changed)
    if (updates.images) {
      queueProjectImages(mergedProject);
    }

    if (__DEV__) console.log(`[Projects] Updated project: ${id}`);
  }, [projects, projects$, queueProjectImages]);

  /** Delete a project (soft delete) */
  const deleteProject = useCallback(async (id: string) => {
    try {
      await removeProjectFromInventory(id);
    } catch (error) {
      if (__DEV__) console.error('[Projects] Failed to clean up inventory references:', error);
    }
    deleteProjectFromStore(projects$, id);
    if (__DEV__) console.log(`[Projects] Deleted project: ${id}`);
  }, [projects$]);

  /** Toggle the "currently working on" status for a project */
  const toggleCurrentlyWorkingOn = useCallback(async (projectId: string): Promise<boolean> => {
    const project = projects.find((p: Project) => p.id === projectId);
    if (!project) return false;

    const currentlyWorkingOnProjects = projects.filter((p: Project) => p.isCurrentlyWorkingOn);
    const isCurrentlyActive = project.isCurrentlyWorkingOn === true;

    if (!isCurrentlyActive && currentlyWorkingOnProjects.length >= 3) {
      if (__DEV__) console.warn('[Projects] Max 3 active projects allowed');
      return false;
    }

    const timestamp = new Date().toISOString();
    // Use boolean for currently_working_on (not 0/1)
    const updates = isCurrentlyActive
      ? { currently_working_on: false, currently_working_on_ended_at: timestamp }
      : { currently_working_on: true, currently_working_on_at: timestamp, currently_working_on_ended_at: null };

    updateProjectInStore(projects$, projectId, updates);
    return true;
  }, [projects, projects$]);

  // Deprecated: used by ImageSyncQueue callback internally now
  const replaceProjectImage = useCallback(async (_projectId: string, _oldUri: string, _newUrl: string) => {
     // No-op for public API, handled by useImageSync internally
  }, []);

  /** Get a project by ID */
  const getProjectById = useCallback((id: string) => projects.find((p: Project) => p.id === id), [projects]);

  /** Get projects by status */
  const getProjectsByStatus = useCallback((status: ProjectStatus) => projects.filter((p: Project) => p.status === status), [projects]);

  /** Projects currently being worked on */
  const currentlyWorkingOnProjects = useMemo(() => projects.filter((p: Project) => p.isCurrentlyWorkingOn), [projects]);

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByStatus,
    refreshProjects: async () => {
      if (__DEV__) console.log('[Projects] Forcing store refresh...');
      setRefreshKey(prev => prev + 1);
    },
    replaceProjectImage,
    currentlyWorkingOnProjects,
    toggleCurrentlyWorkingOn,
    toDoCount: projects.filter((p: Project) => p.status === 'to-do').length,
    inProgressCount: projects.filter((p: Project) => p.status === 'in-progress').length,
    onHoldCount: projects.filter((p: Project) => p.status === 'on-hold').length,
    completedCount: projects.filter((p: Project) => p.status === 'completed').length,
    froggedCount: projects.filter((p: Project) => p.status === 'frogged').length,
  } as const;
});
