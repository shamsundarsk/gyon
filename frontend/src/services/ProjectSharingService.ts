/**
 * Project Sharing Service
 * Handles project sharing via URL and collaboration features
 */

export interface SharedProject {
  id: string;
  name: string;
  description: string;
  files: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  isPublic: boolean;
  shareUrl?: string;
  tags: string[];
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  lastModified: Date;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  files: ProjectFile[];
  tags: string[];
  downloads: number;
  rating: number;
  author: string;
  createdAt: Date;
}

export interface CollaborationSession {
  projectId: string;
  sessionId: string;
  participants: Participant[];
  isActive: boolean;
  createdAt: Date;
}

export interface Participant {
  id: string;
  name: string;
  cursor?: {
    line: number;
    column: number;
    file: string;
  };
  isOnline: boolean;
}

class ProjectSharingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Share a project and get a shareable URL
   */
  async shareProject(project: {
    name: string;
    description: string;
    files: ProjectFile[];
    isPublic: boolean;
    tags: string[];
  }): Promise<SharedProject> {
    try {
      const response = await fetch(`${this.baseUrl}/api/projects/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to share project');
      }

      return result.data.project;
    } catch (error) {
      console.error('Error sharing project:', error);
      throw error;
    }
  }

  /**
   * Load a shared project by ID or share URL
   */
  async loadSharedProject(projectIdOrUrl: string): Promise<SharedProject> {
    try {
      const endpoint = projectIdOrUrl.startsWith('http') 
        ? `/api/projects/load-by-url`
        : `/api/projects/load/${projectIdOrUrl}`;
      
      const body = projectIdOrUrl.startsWith('http')
        ? { shareUrl: projectIdOrUrl }
        : undefined;

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: body ? 'POST' : 'GET',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load shared project');
      }

      return result.data.project;
    } catch (error) {
      console.error('Error loading shared project:', error);
      throw error;
    }
  }

  /**
   * Get project gallery/templates
   */
  async getProjectGallery(filters?: {
    category?: string;
    tags?: string[];
    search?: string;
    sortBy?: 'downloads' | 'rating' | 'recent';
  }): Promise<ProjectTemplate[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.category) queryParams.append('category', filters.category);
      if (filters?.tags) queryParams.append('tags', filters.tags.join(','));
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);

      const response = await fetch(`${this.baseUrl}/api/projects/gallery?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load project gallery');
      }

      return result.data.templates;
    } catch (error) {
      console.error('Error loading project gallery:', error);
      throw error;
    }
  }

  /**
   * Update a shared project
   */
  async updateSharedProject(projectId: string, updates: Partial<SharedProject>): Promise<SharedProject> {
    try {
      const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update shared project');
      }

      return result.data.project;
    } catch (error) {
      console.error('Error updating shared project:', error);
      throw error;
    }
  }

  /**
   * Delete a shared project
   */
  async deleteSharedProject(projectId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete shared project');
      }
    } catch (error) {
      console.error('Error deleting shared project:', error);
      throw error;
    }
  }

  /**
   * Generate a shareable URL for a project
   */
  generateShareUrl(projectId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${projectId}`;
  }

  /**
   * Copy share URL to clipboard
   */
  async copyShareUrl(projectId: string): Promise<void> {
    const shareUrl = this.generateShareUrl(projectId);
    
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  /**
   * Start a collaboration session (placeholder for real-time collaboration)
   */
  async startCollaborationSession(projectId: string): Promise<CollaborationSession> {
    try {
      const response = await fetch(`${this.baseUrl}/api/collaboration/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start collaboration session');
      }

      return result.data.session;
    } catch (error) {
      console.error('Error starting collaboration session:', error);
      throw error;
    }
  }

  /**
   * Join a collaboration session
   */
  async joinCollaborationSession(sessionId: string, participantName: string): Promise<CollaborationSession> {
    try {
      const response = await fetch(`${this.baseUrl}/api/collaboration/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, participantName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join collaboration session');
      }

      return result.data.session;
    } catch (error) {
      console.error('Error joining collaboration session:', error);
      throw error;
    }
  }
}

export const projectSharingService = new ProjectSharingService();