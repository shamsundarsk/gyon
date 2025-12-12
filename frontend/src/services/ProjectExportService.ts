import { Project } from './FileManager';
import { FileNode } from '../components/FileExplorer';

export interface ExportOptions {
  format: 'zip' | 'json';
  includeNodeModules?: boolean;
  includeDotFiles?: boolean;
}

export class ProjectExportService {
  private static instance: ProjectExportService;

  private constructor() {}

  static getInstance(): ProjectExportService {
    if (!ProjectExportService.instance) {
      ProjectExportService.instance = new ProjectExportService();
    }
    return ProjectExportService.instance;
  }

  async exportProject(project: Project, options: ExportOptions = { format: 'zip' }): Promise<void> {
    if (options.format === 'zip') {
      await this.exportAsZip(project, options);
    } else {
      await this.exportAsJSON(project);
    }
  }

  private async exportAsZip(project: Project, options: ExportOptions): Promise<void> {
    try {
      // For now, we'll create a simple zip-like structure using JSZip
      // In a real implementation, you'd use a library like JSZip
      const files = this.flattenFileTree(project.files, options);
      
      // Create a blob with all files
      const zipContent = await this.createZipContent(files, project.name);
      
      // Download the zip file
      this.downloadBlob(zipContent, `${project.name}.zip`, 'application/zip');
    } catch (error) {
      console.error('Failed to export project as ZIP:', error);
      throw new Error('Failed to export project as ZIP');
    }
  }

  private async exportAsJSON(project: Project): Promise<void> {
    try {
      const exportData = {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        },
        files: project.files,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      this.downloadBlob(blob, `${project.name}.json`, 'application/json');
    } catch (error) {
      console.error('Failed to export project as JSON:', error);
      throw new Error('Failed to export project as JSON');
    }
  }

  private flattenFileTree(files: FileNode[], options: ExportOptions, basePath: string = ''): Array<{path: string, content: string}> {
    const result: Array<{path: string, content: string}> = [];

    for (const file of files) {
      const fullPath = basePath ? `${basePath}/${file.name}` : file.name;

      // Skip certain files based on options
      if (!options.includeDotFiles && file.name.startsWith('.')) {
        continue;
      }
      
      if (!options.includeNodeModules && file.name === 'node_modules') {
        continue;
      }

      if (file.type === 'file' && file.content !== undefined) {
        result.push({
          path: fullPath,
          content: file.content
        });
      } else if (file.type === 'folder' && file.children) {
        result.push(...this.flattenFileTree(file.children, options, fullPath));
      }
    }

    return result;
  }

  private async createZipContent(files: Array<{path: string, content: string}>, projectName: string): Promise<Blob> {
    // Simple implementation - in production, use JSZip or similar
    let zipContent = `# ${projectName} - Exported Project\n\n`;
    
    for (const file of files) {
      zipContent += `## File: ${file.path}\n`;
      zipContent += '```\n';
      zipContent += file.content;
      zipContent += '\n```\n\n';
    }

    return new Blob([zipContent], { type: 'text/plain' });
  }

  private downloadBlob(blob: Blob, filename: string, _mimeType: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async importProject(file: File): Promise<Project> {
    try {
      const content = await this.readFileContent(file);
      
      if (file.name.endsWith('.json')) {
        return this.importFromJSON(content);
      } else {
        throw new Error('Unsupported file format. Only JSON imports are supported.');
      }
    } catch (error) {
      console.error('Failed to import project:', error);
      throw new Error('Failed to import project');
    }
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private importFromJSON(content: string): Project {
    try {
      const data = JSON.parse(content);
      
      if (!data.project || !data.files) {
        throw new Error('Invalid project file format');
      }

      const project: Project = {
        id: this.generateId(), // Generate new ID for imported project
        name: `${data.project.name} (Imported)`,
        description: data.project.description || 'Imported project',
        createdAt: new Date(),
        updatedAt: new Date(),
        files: data.files
      };

      return project;
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default ProjectExportService;