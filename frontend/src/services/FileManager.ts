import { CodeFile } from '../components/CodeEditor';
import { FileNode } from '../components/FileExplorer';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  files: FileNode[];
}

export class FileManager {
  private static instance: FileManager;
  private readonly STORAGE_KEY = 'ai-code-editor-projects';
  private readonly ACTIVE_PROJECT_KEY = 'ai-code-editor-active-project';

  private constructor() {}

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  // Project Management
  async createProject(name: string, description: string = ''): Promise<Project> {
    const project: Project = {
      id: this.generateId(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      files: this.getDefaultProjectStructure()
    };

    await this.saveProject(project);
    await this.setActiveProject(project.id);
    return project;
  }

  async getProjects(): Promise<Project[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const projects = JSON.parse(stored);
      return projects.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  async getProject(id: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  async saveProject(project: Project): Promise<void> {
    try {
      const projects = await this.getProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      project.updatedAt = new Date();
      
      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving project:', error);
      throw new Error('Failed to save project');
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const projects = await this.getProjects();
      const filtered = projects.filter(p => p.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      
      // Clear active project if it was deleted
      const activeProjectId = await this.getActiveProjectId();
      if (activeProjectId === id) {
        localStorage.removeItem(this.ACTIVE_PROJECT_KEY);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  async getActiveProjectId(): Promise<string | null> {
    return localStorage.getItem(this.ACTIVE_PROJECT_KEY);
  }

  async setActiveProject(id: string): Promise<void> {
    localStorage.setItem(this.ACTIVE_PROJECT_KEY, id);
  }

  async getActiveProject(): Promise<Project | null> {
    const activeId = await this.getActiveProjectId();
    if (!activeId) return null;
    return this.getProject(activeId);
  }

  // File Operations
  async createFile(projectId: string, path: string, content: string = ''): Promise<FileNode> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const pathParts = path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    const newFile: FileNode = {
      id: this.generateId(),
      name: fileName,
      type: 'file',
      path,
      content
    };

    // Add file to project structure
    project.files = this.addFileToTree(project.files, newFile, pathParts.slice(0, -1));
    await this.saveProject(project);
    
    return newFile;
  }

  async createFolder(projectId: string, path: string): Promise<FileNode> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const pathParts = path.split('/');
    const folderName = pathParts[pathParts.length - 1];
    
    const newFolder: FileNode = {
      id: this.generateId(),
      name: folderName,
      type: 'folder',
      path,
      children: []
    };

    // Add folder to project structure
    project.files = this.addFileToTree(project.files, newFolder, pathParts.slice(0, -1));
    await this.saveProject(project);
    
    return newFolder;
  }

  async updateFile(projectId: string, filePath: string, content: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    project.files = this.updateFileInTree(project.files, filePath, content);
    await this.saveProject(project);
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    project.files = this.removeFileFromTree(project.files, path);
    await this.saveProject(project);
  }

  async getFile(projectId: string, path: string): Promise<CodeFile | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    const fileNode = this.findFileInTree(project.files, path);
    if (!fileNode || fileNode.type !== 'file') return null;

    return {
      id: fileNode.id,
      name: fileNode.name,
      content: fileNode.content || '',
      language: this.getLanguageFromExtension(fileNode.name),
      path: fileNode.path
    };
  }

  // File format support
  getSupportedFormats(): string[] {
    return [
      'js', 'jsx', 'ts', 'tsx',
      'py', 'html', 'css', 'scss', 'less',
      'json', 'xml', 'yaml', 'yml',
      'md', 'txt', 'sql', 'php',
      'java', 'cpp', 'c', 'cs',
      'go', 'rs', 'rb', 'sh'
    ];
  }

  getLanguageFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'txt': 'plaintext',
      'sql': 'sql',
      'php': 'php',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'sh': 'shell'
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  // Private helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultProjectStructure(): FileNode[] {
    return [
      {
        id: this.generateId(),
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
          {
            id: this.generateId(),
            name: 'index.js',
            type: 'file',
            path: 'src/index.js',
            content: '// Welcome to your new project!\nconsole.log("Hello, World!");'
          },
          {
            id: this.generateId(),
            name: 'app.js',
            type: 'file',
            path: 'src/app.js',
            content: '// Main application file\nfunction App() {\n  return "Hello from App!";\n}\n\nmodule.exports = App;'
          }
        ]
      },
      {
        id: this.generateId(),
        name: 'package.json',
        type: 'file',
        path: 'package.json',
        content: JSON.stringify({
          name: 'my-project',
          version: '1.0.0',
          description: 'A new project created with AI Code Editor',
          main: 'src/index.js',
          scripts: {
            start: 'node src/index.js',
            test: 'echo "Error: no test specified" && exit 1'
          },
          keywords: [],
          author: '',
          license: 'MIT'
        }, null, 2)
      },
      {
        id: this.generateId(),
        name: 'README.md',
        type: 'file',
        path: 'README.md',
        content: '# My Project\n\nThis project was created with the AI Code Editor.\n\n## Getting Started\n\n1. Edit your files in the `src` directory\n2. Use the AI assistant for help with coding\n3. Run your project with `npm start`\n\n## Features\n\n- AI-powered code completion\n- Syntax highlighting\n- File management\n- Real-time editing\n'
      }
    ];
  }

  private addFileToTree(files: FileNode[], newNode: FileNode, pathParts: string[]): FileNode[] {
    if (pathParts.length === 0) {
      return [...files, newNode];
    }

    const [currentPart, ...remainingParts] = pathParts;
    return files.map(file => {
      if (file.name === currentPart && file.type === 'folder') {
        return {
          ...file,
          children: this.addFileToTree(file.children || [], newNode, remainingParts)
        };
      }
      return file;
    });
  }

  private updateFileInTree(files: FileNode[], filePath: string, content: string): FileNode[] {
    return files.map(file => {
      if (file.path === filePath && file.type === 'file') {
        return { ...file, content };
      }
      if (file.children) {
        return {
          ...file,
          children: this.updateFileInTree(file.children, filePath, content)
        };
      }
      return file;
    });
  }

  private removeFileFromTree(files: FileNode[], path: string): FileNode[] {
    return files.filter(file => {
      if (file.path === path) return false;
      if (file.children) {
        file.children = this.removeFileFromTree(file.children, path);
      }
      return true;
    });
  }

  private findFileInTree(files: FileNode[], path: string): FileNode | null {
    for (const file of files) {
      if (file.path === path) return file;
      if (file.children) {
        const found = this.findFileInTree(file.children, path);
        if (found) return found;
      }
    }
    return null;
  }
}

export default FileManager;