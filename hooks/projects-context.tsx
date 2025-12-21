import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '@/types';
import { syncProjectMaterials, removeProjectFromInventory } from '@/lib/sync';

export const [ProjectsProvider, useProjects] = createContextHook(() => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await AsyncStorage.getItem('projects');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setProjects(parsed.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            // Migration: handle new optional date fields
            startDate: p.startDate ? new Date(p.startDate) : undefined,
            completedDate: p.completedDate ? new Date(p.completedDate) : undefined,
          })));
        } catch (parseError) {
          console.error('Failed to parse projects data, resetting:', parseError);
          // Clear corrupted data and start fresh
          await AsyncStorage.removeItem('projects');
          setProjects([]);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProjects = async (updatedProjects: Project[]) => {
    try {
      const jsonData = JSON.stringify(updatedProjects);
      await AsyncStorage.setItem('projects', jsonData);

      // Verify the save was successful by reading it back
      const savedData = await AsyncStorage.getItem('projects');
      if (!savedData) {
        throw new Error('Data was not saved to AsyncStorage');
      }

      console.log(`✅ Successfully saved ${updatedProjects.length} projects to AsyncStorage`);
    } catch (error) {
      console.error('❌ Failed to save projects:', error);
      throw error; // Re-throw to let the caller know it failed
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updated = [...projects, newProject];
    setProjects(updated);
    await saveProjects(updated);
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const existingProject = projects.find(p => p.id === id);
    if (!existingProject) {
      console.error(`❌ Project ${id} not found`);
      return;
    }

    console.log('📥 updateProject received updates:', {
      id,
      yarnUsedIds: updates.yarnUsedIds,
      hookUsedIds: updates.hookUsedIds,
    });

    // Sync inventory items if material IDs are being updated
    const hasYarnChanges = updates.yarnUsedIds !== undefined;
    const hasHookChanges = updates.hookUsedIds !== undefined;

    if (hasYarnChanges || hasHookChanges) {
      try {
        await syncProjectMaterials(
          id,
          updates.yarnUsedIds ?? existingProject.yarnUsedIds ?? [],
          updates.hookUsedIds ?? existingProject.hookUsedIds ?? [],
          existingProject.yarnUsedIds ?? [],
          existingProject.hookUsedIds ?? []
        );
        console.log('✅ Inventory items synced with project materials');
      } catch (error) {
        console.error('❌ Failed to sync inventory items:', error);
        // Continue with project update even if sync fails
      }
    }

    const updated = projects.map(p => {
      if (p.id === id) {
        const updatedProject = { ...p, ...updates, updatedAt: new Date() };

        console.log('🔄 Updating project from:', {
          oldYarn: p.yarnUsedIds,
          oldHook: p.hookUsedIds,
        });
        console.log('🔄 Updating project to:', {
          newYarn: updatedProject.yarnUsedIds,
          newHook: updatedProject.hookUsedIds,
        });

        // Auto-set completedDate when status changes to 'completed'
        if (updates.status === 'completed' && p.status !== 'completed') {
          updatedProject.completedDate = new Date();
        }
        // Clear completedDate if status changes away from 'completed'
        else if (updates.status && updates.status !== 'completed' && p.status === 'completed') {
          updatedProject.completedDate = undefined;
        }

        return updatedProject;
      }
      return p;
    });

    // Update state first (optimistic update)
    setProjects(updated);

    // Then save to AsyncStorage
    try {
      await saveProjects(updated);
      console.log(`✅ Project ${id} updated successfully`);
    } catch (error) {
      // If save fails, revert the state
      console.error(`❌ Failed to save project ${id}, reverting state`, error);
      setProjects(projects); // Revert to original state
      throw error; // Re-throw so the UI can show an error
    }
  };

  const deleteProject = async (id: string) => {
    // First, clean up inventory references
    try {
      await removeProjectFromInventory(id);
      console.log('✅ Inventory items cleaned up after project deletion');
    } catch (error) {
      console.error('❌ Failed to clean up inventory references:', error);
      // Continue with deletion even if cleanup fails
    }

    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    await saveProjects(updated);
  };

  const getProjectById = (id: string) => {
    const project = projects.find(p => p.id === id);
    console.log(`🔍 getProjectById(${id}):`, project ? `Found: ${project.title}` : 'NOT FOUND');
    console.log(`📊 Total projects in context: ${projects.length}`);
    return project;
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter(p => p.status === status);
  };

  // Refresh projects from AsyncStorage (for cross-context sync)
  const refreshProjects = async () => {
    await loadProjects();
    console.log('🔄 Projects refreshed from AsyncStorage');
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
    planningCount: projects.filter(p => p.status === 'planning').length,
    inProgressCount: projects.filter(p => p.status === 'in-progress').length,
    onHoldCount: projects.filter(p => p.status === 'on-hold').length,
    completedCount: projects.filter(p => p.status === 'completed').length,
    froggedCount: projects.filter(p => p.status === 'frogged').length,
  };
});