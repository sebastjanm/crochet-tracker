/**
 * Projects Context (Legend-State Native)
 *
 * ARCHITECTURE:
 * - Source of Truth: Legend-State Observable (projects$)
 * - Persistence: AsyncStorage (handled by Legend-State)
 * - Sync: Supabase (handled by Legend-State)
 *
 * OFFICIAL API USAGE (production-grade):
 * - syncState(obs$).isPersistLoaded - local persistence loaded
 * - syncState(obs$).isLoaded - remote sync complete
 * - syncState(obs$).clearPersist() - clear cache for full refresh
 * - syncState(obs$).sync() - force re-sync
 *
 * @see https://legendapp.com/open-source/state/v3/sync/persist-sync/
 */

import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useSelector, useObserve } from '@legendapp/state/react';
import { syncState } from '@legendapp/state';
import { Project, ProjectStatus, ProjectYarn, ProjectImage } from '@/types';
import { syncProjectMaterials, removeProjectFromInventory } from '@/lib/cross-context-sync';

// Helper to extract URL string from ProjectImage (which can be string | ImageSource)
function getImageUrlString(image: ProjectImage): string | undefined {
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image !== null && 'uri' in image && typeof image.uri === 'string') {
    return image.uri;
  }
  return undefined;
}
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
import {
  deleteImage,
  extractPathFromUrl,
  isSupabaseStorageUrl,
} from '@/lib/supabase/storage';

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

  // Track sync state separately to avoid render-cycle issues
  // Using useState + useObserve instead of useSelector for syncState
  const [syncStatus, setSyncStatus] = useState({
    isPersistLoaded: false,
    isLoaded: false,
  });

  // Keep ref updated for use in refresh function
  const syncStateRef = useRef(syncState(projects$));

  // Re-subscribe to sync state when projects$ changes (after refresh)
  useEffect(() => {
    syncStateRef.current = syncState(projects$);

    // Reset sync status for new observable
    setSyncStatus({ isPersistLoaded: false, isLoaded: false });

    if (__DEV__) {
      console.log('[Projects] New observable - watching sync state');
    }
  }, [projects$]);

  // Observe sync state changes - must access projects$ directly for reactivity
  useObserve(() => {
    // Access projects$ directly so useObserve tracks it as a dependency
    const state = syncState(projects$);
    const isPersistLoaded = state.isPersistLoaded?.get() ?? false;
    const isLoaded = state.isLoaded?.get() ?? false;

    // Update state in next tick to avoid render-cycle issues
    setTimeout(() => {
      setSyncStatus({ isPersistLoaded, isLoaded });
    }, 0);

    if (__DEV__) {
      console.log('[Projects] Sync status:', { isPersistLoaded, isLoaded });
    }
  });

  // Loading = not yet loaded from cache OR (Pro user AND remote not loaded)
  const isLoading = !syncStatus.isPersistLoaded || (isPro && !syncStatus.isLoaded);

  // Sync complete when both persistence AND remote are loaded
  const isSyncComplete = syncStatus.isPersistLoaded && syncStatus.isLoaded;

  // Auto-reconciliation: detect orphaned projects after sync completes
  // This catches edge cases where data was modified directly in Supabase
  // Runs for ALL authenticated users (smart safety check protects never-synced users)
  useEffect(() => {
    if (!user?.id || !isSyncComplete) return; // Wait for sync to complete

    reconcileProjects(user.id, projects$).then((result) => {
      if (result.removed > 0 && __DEV__) {
        console.log(`[Projects] Reconciliation removed ${result.removed} orphaned projects`);
      }
    });
  }, [user?.id, projects$, isSyncComplete]);

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

    // Handle removed images - delete from Supabase Storage
    if (updates.images !== undefined) {
      const oldUrls = (existingProject.images || []).map(getImageUrlString).filter(Boolean) as string[];
      const newUrls = (updates.images || []).map(getImageUrlString).filter(Boolean) as string[];

      // Find images that were removed
      const removedUrls = oldUrls.filter(url => !newUrls.includes(url));

      for (const imageUrl of removedUrls) {
        if (isSupabaseStorageUrl(imageUrl)) {
          const path = extractPathFromUrl(imageUrl, 'project-images');
          if (path) {
            const result = await deleteImage(path, 'project-images');
            if (__DEV__) {
              if (result.success) {
                console.log(`[Projects] Deleted removed image from storage: ${path}`);
              } else {
                console.error(`[Projects] Failed to delete image: ${result.error}`);
              }
            }
          }
        }
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

  /** Delete a project (soft delete + delete images from storage) */
  const deleteProject = useCallback(async (id: string) => {
    const projectToDelete = projects.find((p: Project) => p.id === id);

    // Clean up inventory references
    try {
      await removeProjectFromInventory(id);
    } catch (error) {
      if (__DEV__) console.error('[Projects] Failed to clean up inventory references:', error);
    }

    // Delete all images from Supabase Storage
    if (projectToDelete?.images?.length) {
      for (const image of projectToDelete.images) {
        const imageUrl = getImageUrlString(image);
        if (imageUrl && isSupabaseStorageUrl(imageUrl)) {
          const path = extractPathFromUrl(imageUrl, 'project-images');
          if (path) {
            const result = await deleteImage(path, 'project-images');
            if (__DEV__) {
              if (result.success) {
                console.log(`[Projects] Deleted image from storage: ${path}`);
              } else {
                console.error(`[Projects] Failed to delete image: ${result.error}`);
              }
            }
          }
        }
      }
    }

    deleteProjectFromStore(projects$, id);
    if (__DEV__) console.log(`[Projects] Deleted project: ${id}`);
  }, [projects, projects$]);

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
    // Sync local changes to cloud (does NOT clear local data)
    syncToCloud: async () => {
      if (__DEV__) console.log('[Projects] Syncing to cloud...');
      try {
        const state = syncState(projects$);
        await state.sync();
        if (__DEV__) console.log('[Projects] Sync to cloud complete');
        return true;
      } catch (error) {
        if (__DEV__) console.error('[Projects] Sync to cloud failed:', error);
        return false;
      }
    },
    // Force a full refresh from Supabase (CLEARS local data first!)
    refreshProjects: async () => {
      if (__DEV__) console.log('[Projects] Triggering FULL refresh (clears local)...');

      try {
        const state = syncState(projects$);

        // 1. Clear local persistence (this removes cached data)
        await state.clearPersist();
        if (__DEV__) console.log('[Projects] Cleared persist');

        // 2. Force a fresh sync from Supabase
        await state.sync();
        if (__DEV__) console.log('[Projects] Sync complete');

        return true;
      } catch (error) {
        if (__DEV__) console.error('[Projects] Refresh failed:', error);
        return false;
      }
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
