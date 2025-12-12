import { useState, useEffect, useCallback } from 'react';
import FileManager, { Project } from '../services/FileManager';
import { CodeFile } from '../components/CodeEditor';
import { FileNode } from '../components/FileExplorer';

export interface UseFileManagerReturn {
  // Project state
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Project operations
  createProject: (name: string, description?: string) => Promise<Project>;
  loadProject: (id: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // File operations
  createFile: (path: string, content?: string) => Promise<FileNode>;
  createFolder: (path: string) => Promise<FileNode>;
  updateFile: (filePath: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  getFile: (path: string) => Promise<CodeFile | null>;

  // Utility
  clearError: () => void;
  refreshProjects: () => Promise<void>;
}

export const useFileManager = (): UseFileManagerReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileManager = FileManager.getInstance();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsList, activeProj] = await Promise.all([
        fileManager.getProjects(),
        fileManager.getActiveProject()
      ]);

      setProjects(projectsList);
      setActiveProject(activeProj);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = useCallback(async (name: string, description: string = ''): Promise<Project> => {
    try {
      setError(null);
      const project = await fileManager.createProject(name, description);
      
      setProjects(prev => [...prev, project]);
      setActiveProject(project);
      
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fileManager]);

  const loadProject = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      const project = await fileManager.getProject(id);
      if (!project) {
        throw new Error('Project not found');
      }

      await fileManager.setActiveProject(id);
      setActiveProject(project);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fileManager]);

  const saveCurrentProject = useCallback(async (): Promise<void> => {
    if (!activeProject) {
      throw new Error('No active project to save');
    }

    try {
      setError(null);
      await fileManager.saveProject(activeProject);
      
      // Update projects list
      setProjects(prev => 
        prev.map(p => p.id === activeProject.id ? activeProject : p)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeProject, fileManager]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await fileManager.deleteProject(id);
      
      setProjects(prev => prev.filter(p => p.id !== id));
      
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeProject, fileManager]);

  const createFile = useCallback(async (path: string, content: string = ''): Promise<FileNode> => {
    if (!activeProject) {
      throw new Error('No active project');
    }

    try {
      setError(null);
      const newFile = await fileManager.createFile(activeProject.id, path, content);
      
      // Reload the active project to get updated file structure
      const updatedProject = await fileManager.getProject(activeProject.id);
      if (updatedProject) {
        setActiveProject(updatedProject);
      }
      
      return newFile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create file';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeProject, fileManager]);

  const createFolder = useCallback(async (path: string): Promise<FileNode> => {
    if (!activeProject) {
      throw new Error('No active project');
    }

    try {
      setError(null);
      const newFolder = await fileManager.createFolder(activeProject.id, path);
      
      // Reload the active project to get updated file structure
      const updatedProject = await fileManager.getProject(activeProject.id);
      if (updatedProject) {
        setActiveProject(updatedProject);
      }
      
      return newFolder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeProject, fileManager]);

  const updateFile = useCallback(async (filePath: string, content: string): Promise<void> => {
    if (!activeProject) {
      throw new Error('No active project');
    }

    try {
      setError(null);
      await fileManager.updateFile(activeProject.id, filePath, content);
      
      // Update the active project state
      const updatedProject = await fileManager.getProject(activeProject.id);
      if (updatedProject) {
        setActiveProject(updatedProject);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update file';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeProject, fileManager]);

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    if (!activeProject) {
      throw new Error('No active project');
    }

    try {
      setError(null);
      await fileManager.deleteFile(activeProject.id, path);
      
      // Reload the active project to get updated file structure
      const updatedProject = await fileManager.getProject(activeProject.id);
      if (updatedProject) {
        setActiveProject(updatedProject);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [activeProject, fileManager]);

  const getFile = useCallback(async (path: string): Promise<CodeFile | null> => {
    if (!activeProject) {
      return null;
    }

    try {
      setError(null);
      return await fileManager.getFile(activeProject.id, path);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get file';
      setError(errorMessage);
      return null;
    }
  }, [activeProject, fileManager]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshProjects = useCallback(async (): Promise<void> => {
    await loadInitialData();
  }, []);

  return {
    // State
    projects,
    activeProject,
    isLoading,
    error,

    // Project operations
    createProject,
    loadProject,
    saveCurrentProject,
    deleteProject,

    // File operations
    createFile,
    createFolder,
    updateFile,
    deleteFile,
    getFile,

    // Utility
    clearError,
    refreshProjects
  };
};

export default useFileManager;