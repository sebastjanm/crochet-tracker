import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '@/types';

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
      await AsyncStorage.setItem('projects', JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Failed to save projects:', error);
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
    const updated = projects.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date() }
        : p
    );
    setProjects(updated);
    await saveProjects(updated);
  };

  const deleteProject = async (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    await saveProjects(updated);
  };

  const getProjectById = (id: string) => {
    return projects.find(p => p.id === id);
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter(p => p.status === status);
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByStatus,
    ideaCount: projects.filter(p => p.status === 'idea').length,
    inProgressCount: projects.filter(p => p.status === 'in-progress').length,
    completedCount: projects.filter(p => p.status === 'completed').length,
    maybeSomedayCount: projects.filter(p => p.status === 'maybe-someday').length,
  };
});