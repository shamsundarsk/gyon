/**
 * Project Sharing Service
 * Backend service for handling project sharing and collaboration
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/errorLogger';

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
  private sharedProjects: Map<string, SharedProject> = new Map();
  private projectTemplates: Map<string, ProjectTemplate> = new Map();
  private collaborationSessions: Map<string, CollaborationSession> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Share a project and generate a shareable URL
   */
  async shareProject(projectData: {
    name: string;
    description: string;
    files: ProjectFile[];
    isPublic: boolean;
    tags: string[];
  }): Promise<SharedProject> {
    try {
      const projectId = uuidv4();
      const now = new Date();
      
      const sharedProject: SharedProject = {
        id: projectId,
        name: projectData.name,
        description: projectData.description,
        files: projectData.files.map(file => ({
          ...file,
          lastModified: new Date(file.lastModified || now),
        })),
        createdAt: now,
        updatedAt: now,
        owner: 'anonymous', // In a real implementation, this would be the authenticated user
        isPublic: projectData.isPublic,
        shareUrl: this.generateShareUrl(projectId),
        tags: projectData.tags,
      };

      this.sharedProjects.set(projectId, sharedProject);
      
      logger.logInfo(`Project shared: ${projectId}`, {
        projectName: projectData.name,
        isPublic: projectData.isPublic,
      });

      return sharedProject;
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        projectName: projectData.name,
      });
      throw error;
    }
  }

  /**
   * Load a shared project by ID
   */
  async loadSharedProject(projectId: string): Promise<SharedProject> {
    try {
      const project = this.sharedProjects.get(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      if (!project.isPublic) {
        // In a real implementation, check if user has access
        logger.logWarning('Attempted to access private project', { projectId });
      }

      return project;
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        projectId,
      });
      throw error;
    }
  }

  /**
   * Load a shared project by share URL
   */
  async loadSharedProjectByUrl(shareUrl: string): Promise<SharedProject> {
    try {
      // Extract project ID from URL
      const urlParts = shareUrl.split('/');
      const projectId = urlParts[urlParts.length - 1];
      
      return await this.loadSharedProject(projectId);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        shareUrl,
      });
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
      let templates = Array.from(this.projectTemplates.values());

      // Apply filters
      if (filters?.category) {
        templates = templates.filter(t => t.category === filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        templates = templates.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'downloads':
          templates.sort((a, b) => b.downloads - a.downloads);
          break;
        case 'rating':
          templates.sort((a, b) => b.rating - a.rating);
          break;
        case 'recent':
          templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        default:
          templates.sort((a, b) => b.downloads - a.downloads);
      }

      return templates;
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        filters,
      });
      throw error;
    }
  }

  /**
   * Update a shared project
   */
  async updateSharedProject(projectId: string, updates: Partial<SharedProject>): Promise<SharedProject> {
    try {
      const project = this.sharedProjects.get(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      const updatedProject: SharedProject = {
        ...project,
        ...updates,
        id: projectId, // Ensure ID cannot be changed
        updatedAt: new Date(),
      };

      this.sharedProjects.set(projectId, updatedProject);
      
      logger.logInfo(`Project updated: ${projectId}`, {
        updates: Object.keys(updates),
      });

      return updatedProject;
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        projectId,
      });
      throw error;
    }
  }

  /**
   * Delete a shared project
   */
  async deleteSharedProject(projectId: string): Promise<void> {
    try {
      const project = this.sharedProjects.get(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      this.sharedProjects.delete(projectId);
      
      logger.logInfo(`Project deleted: ${projectId}`, {
        projectName: project.name,
      });
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        projectId,
      });
      throw error;
    }
  }

  /**
   * Start a collaboration session
   */
  async startCollaborationSession(projectId: string): Promise<CollaborationSession> {
    try {
      const project = this.sharedProjects.get(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      const sessionId = uuidv4();
      const session: CollaborationSession = {
        projectId,
        sessionId,
        participants: [],
        isActive: true,
        createdAt: new Date(),
      };

      this.collaborationSessions.set(sessionId, session);
      
      logger.logInfo(`Collaboration session started: ${sessionId}`, {
        projectId,
      });

      return session;
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        projectId,
      });
      throw error;
    }
  }

  /**
   * Join a collaboration session
   */
  async joinCollaborationSession(sessionId: string, participantName: string): Promise<CollaborationSession> {
    try {
      const session = this.collaborationSessions.get(sessionId);
      
      if (!session) {
        throw new Error('Collaboration session not found');
      }

      if (!session.isActive) {
        throw new Error('Collaboration session is not active');
      }

      const participantId = uuidv4();
      const participant: Participant = {
        id: participantId,
        name: participantName,
        isOnline: true,
      };

      session.participants.push(participant);
      
      logger.logInfo(`Participant joined collaboration session: ${sessionId}`, {
        participantName,
        participantId,
      });

      return session;
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        sessionId,
        participantName,
      });
      throw error;
    }
  }

  /**
   * Generate a share URL for a project
   */
  private generateShareUrl(projectId: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/shared/${projectId}`;
  }

  /**
   * Initialize default project templates
   */
  private initializeDefaultTemplates(): void {
    const templates: ProjectTemplate[] = [
      {
        id: 'react-starter',
        name: 'React Starter',
        description: 'A basic React application with TypeScript',
        category: 'Frontend',
        files: [
          {
            path: 'src/App.tsx',
            content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello React!</h1>
        <p>Edit src/App.tsx and save to reload.</p>
      </header>
    </div>
  );
}

export default App;`,
            language: 'typescript',
            lastModified: new Date(),
          },
          {
            path: 'src/App.css',
            content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}`,
            language: 'css',
            lastModified: new Date(),
          },
        ],
        tags: ['react', 'typescript', 'frontend'],
        downloads: 150,
        rating: 4.5,
        author: 'AI Code Editor',
        createdAt: new Date(),
      },
      {
        id: 'node-api',
        name: 'Node.js API',
        description: 'A simple Express.js API with TypeScript',
        category: 'Backend',
        files: [
          {
            path: 'src/server.ts',
            content: `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
            language: 'typescript',
            lastModified: new Date(),
          },
        ],
        tags: ['nodejs', 'express', 'api', 'typescript'],
        downloads: 89,
        rating: 4.2,
        author: 'AI Code Editor',
        createdAt: new Date(),
      },
      {
        id: 'python-script',
        name: 'Python Data Analysis',
        description: 'A Python script for basic data analysis',
        category: 'Data Science',
        files: [
          {
            path: 'main.py',
            content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def analyze_data(data_file):
    """
    Analyze data from a CSV file
    """
    # Load data
    df = pd.read_csv(data_file)
    
    # Basic statistics
    print("Data Shape:", df.shape)
    print("\\nBasic Statistics:")
    print(df.describe())
    
    # Plot histogram for numeric columns
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    if len(numeric_columns) > 0:
        df[numeric_columns].hist(figsize=(12, 8))
        plt.tight_layout()
        plt.show()

if __name__ == "__main__":
    # Example usage
    print("Data Analysis Script")
    print("Replace 'data.csv' with your actual data file")`,
            language: 'python',
            lastModified: new Date(),
          },
        ],
        tags: ['python', 'data-science', 'pandas', 'analysis'],
        downloads: 67,
        rating: 4.0,
        author: 'AI Code Editor',
        createdAt: new Date(),
      },
    ];

    templates.forEach(template => {
      this.projectTemplates.set(template.id, template);
    });
  }
}

export const projectSharingService = new ProjectSharingService();