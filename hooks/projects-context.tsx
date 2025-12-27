/**
 * Projects Context (Legend-State Native)
 *
 * ARCHITECTURE:
 * - Source of Truth: Legend-State Observable (projects$)
 * - Persistence: AsyncStorage (handled by Legend-State)
 * - Sync: Supabase (handled by Legend-State)
 */

import createContextHook from '@nkzw/create-context-hook';
import { useSelector } from '@legendapp/state/react';
import { Project, ProjectStatus, ProjectYarn } from '@/types';
import { syncProjectMaterials, removeProjectFromInventory } from '@/lib/cross-context-sync';
import {
  getStores,
  addProject as addProjectToStore,
  updateProject as updateProjectInStore,
  deleteProject as deleteProjectFromStore,
} from '@/lib/legend-state/config';
import { useAuth } from '@/hooks/auth-context';
import { useImageSync } from '@/hooks/useImageSync';
import {
  mapRowToProject,
  mapProjectToRow,
} from '@/lib/legend-state/mappers';

export const [ProjectsProvider, useProjects] = createContextHook(() => {
  const { user, isPro } = useAuth();
  const { queueProjectImages } = useImageSync();
  
  // Get the reactive store
  const { projects$ } = getStores(user?.id ?? null, isPro);

  // 2. Reactive Data Selector
  const projects = useSelector(() => {
    const projectsMap = projects$.get();
    if (!projectsMap) return [];

    return Object.values(projectsMap)
      .filter((row: any) => !row.deleted)
      .map((row: any) => {
        const project = mapRowToProject(row);
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

  const addProject = async (
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

    // 3. Queue Images
    if (project.images?.length) {
       // We need to pass the row with the correct ID to the queue
       queueProjectImages({ ...row, id });
    }

    return {
      ...project,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const existingProject = projects.find((p: Project) => p.id === id);
    if (!existingProject) {
      console.error(`[Projects] Project ${id} not found`);
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
        console.error('[Projects] Failed to sync inventory items:', error);
      }
    }

    // Handle Status
    let completedDate = updates.completedDate ?? existingProject.completedDate;
    if (updates.status === 'completed' && existingProject.status !== 'completed') {
      completedDate = new Date();
    } else if (updates.status && updates.status !== 'completed' && existingProject.status === 'completed') {
      completedDate = undefined;
    }

    const mergedProject = { ...existingProject, ...updates, completedDate };
    const rowUpdates = mapProjectToRow(mergedProject);

    // Update Store
    updateProjectInStore(projects$, id, rowUpdates);

    // Queue Images (if changed)
    if (updates.images) {
      // Use the raw row format expected by queueProjectImages
      queueProjectImages({ ...rowUpdates, id });
    }

    console.log(`[Projects] Updated project: ${id}`);
  };

  const deleteProject = async (id: string) => {
    try {
      await removeProjectFromInventory(id);
    } catch (error) {
      console.error('[Projects] Failed to clean up inventory references:', error);
    }
    deleteProjectFromStore(projects$, id);
    console.log(`[Projects] Deleted project: ${id}`);
  };

  const toggleCurrentlyWorkingOn = async (projectId: string): Promise<boolean> => {
    const project = projects.find((p: Project) => p.id === projectId);
    if (!project) return false;

    const currentlyWorkingOnProjects = projects.filter((p: Project) => p.isCurrentlyWorkingOn);
    const isCurrentlyActive = project.isCurrentlyWorkingOn === true;
    
    if (!isCurrentlyActive && currentlyWorkingOnProjects.length >= 3) {
      console.warn('[Projects] Max 3 active projects allowed');
      return false;
    }

    const timestamp = new Date().toISOString();
    const updates = isCurrentlyActive
      ? { currently_working_on: 0, currently_working_on_ended_at: timestamp }
      : { currently_working_on: 1, currently_working_on_at: timestamp, currently_working_on_ended_at: null };

    updateProjectInStore(projects$, projectId, updates);
    return true;
  };

  // Deprecated: used by ImageSyncQueue callback internally now
  const replaceProjectImage = async (projectId: string, oldUri: string, newUrl: string) => {
     // No-op for public API, handled by useImageSync internally
  };

  const getProjectById = (id: string) => projects.find((p: Project) => p.id === id);
  const getProjectsByStatus = (status: ProjectStatus) => projects.filter((p: Project) => p.status === status);
  const currentlyWorkingOnProjects = projects.filter((p: Project) => p.isCurrentlyWorkingOn);

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByStatus,
    refreshProjects: async () => {}, 
    replaceProjectImage,
    currentlyWorkingOnProjects,
    toggleCurrentlyWorkingOn,
    toDoCount: projects.filter((p: Project) => p.status === 'to-do').length,
    inProgressCount: projects.filter((p: Project) => p.status === 'in-progress').length,
    onHoldCount: projects.filter((p: Project) => p.status === 'on-hold').length,
    completedCount: projects.filter((p: Project) => p.status === 'completed').length,
    froggedCount: projects.filter((p: Project) => p.status === 'frogged').length,
  };
});
