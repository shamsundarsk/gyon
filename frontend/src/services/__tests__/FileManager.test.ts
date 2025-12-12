import { describe, it, expect, beforeEach, vi } from 'vitest';
import FileManager, { Project } from '../FileManager';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('FileManager', () => {
  let fileManager: FileManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock to return empty state
    localStorageMock.getItem.mockReturnValue(null);
    fileManager = FileManager.getInstance();
  });

  describe('Project Management', () => {
    it('creates a new project with default structure', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const project = await fileManager.createProject('Test Project', 'Test description');
      
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test description');
      expect(project.files).toHaveLength(3); // src folder, package.json, README.md
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('loads existing projects from localStorage', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          description: 'Description 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          files: []
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockProjects));
      
      const projects = await fileManager.getProjects();
      
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Project 1');
      expect(projects[0].createdAt).toBeInstanceOf(Date);
    });

    it('handles localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const projects = await fileManager.getProjects();
      
      expect(projects).toEqual([]);
    });

    it('deletes a project', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', files: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', name: 'Project 2', files: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockProjects));
      
      await fileManager.deleteProject('1');
      
      // Check that setItem was called (the exact content will include dates)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai-code-editor-projects',
        expect.stringContaining('"id":"2"')
      );
    });
  });

  describe('File Operations', () => {
    let testProject: Project;

    beforeEach(async () => {
      // Create a storage object to simulate localStorage
      const storage: Record<string, string> = {};
      
      // Mock localStorage with dynamic storage
      localStorageMock.getItem.mockImplementation((key: string) => storage[key] || null);
      localStorageMock.setItem.mockImplementation((key: string, value: string) => {
        storage[key] = value;
      });
      
      // Start with empty storage
      storage['ai-code-editor-projects'] = '[]';
      
      testProject = await fileManager.createProject('Test Project');
    });

    it('creates a new file', async () => {
      const newFile = await fileManager.createFile(testProject.id, 'test.js', 'console.log("test");');
      
      expect(newFile.name).toBe('test.js');
      expect(newFile.type).toBe('file');
      expect(newFile.content).toBe('console.log("test");');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('creates a new folder', async () => {
      const newFolder = await fileManager.createFolder(testProject.id, 'components');
      
      expect(newFolder.name).toBe('components');
      expect(newFolder.type).toBe('folder');
      expect(newFolder.children).toEqual([]);
    });

    it('updates file content', async () => {
      // First create a file
      await fileManager.createFile(testProject.id, 'test.js', 'original content');
      
      // Then update it
      await fileManager.updateFile(testProject.id, 'test.js', 'updated content');
      
      // Verify the update was saved
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('retrieves a file as CodeFile', async () => {
      await fileManager.createFile(testProject.id, 'test.js', 'console.log("test");');
      
      const file = await fileManager.getFile(testProject.id, 'test.js');
      
      expect(file).not.toBeNull();
      expect(file?.name).toBe('test.js');
      expect(file?.content).toBe('console.log("test");');
      expect(file?.language).toBe('javascript');
    });

    it('returns null for non-existent file', async () => {
      const file = await fileManager.getFile(testProject.id, 'nonexistent.js');
      
      expect(file).toBeNull();
    });

    it('deletes a file', async () => {
      await fileManager.createFile(testProject.id, 'test.js', 'content');
      await fileManager.deleteFile(testProject.id, 'test.js');
      
      const file = await fileManager.getFile(testProject.id, 'test.js');
      expect(file).toBeNull();
    });
  });

  describe('Language Detection', () => {
    it('detects JavaScript files', () => {
      expect(fileManager.getLanguageFromExtension('app.js')).toBe('javascript');
      expect(fileManager.getLanguageFromExtension('component.jsx')).toBe('javascript');
    });

    it('detects TypeScript files', () => {
      expect(fileManager.getLanguageFromExtension('app.ts')).toBe('typescript');
      expect(fileManager.getLanguageFromExtension('component.tsx')).toBe('typescript');
    });

    it('detects Python files', () => {
      expect(fileManager.getLanguageFromExtension('script.py')).toBe('python');
    });

    it('defaults to plaintext for unknown extensions', () => {
      expect(fileManager.getLanguageFromExtension('unknown.xyz')).toBe('plaintext');
      expect(fileManager.getLanguageFromExtension('noextension')).toBe('plaintext');
    });
  });

  describe('File Format Support', () => {
    it('returns list of supported formats', () => {
      const formats = fileManager.getSupportedFormats();
      
      expect(formats).toContain('js');
      expect(formats).toContain('ts');
      expect(formats).toContain('py');
      expect(formats).toContain('html');
      expect(formats).toContain('css');
    });

    it('supports multiple file formats', () => {
      const formats = fileManager.getSupportedFormats();
      
      expect(formats.length).toBeGreaterThan(10);
    });
  });

  describe('Data Integrity', () => {
    it('maintains file data integrity across operations', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const project = await fileManager.createProject('Test Project');
      
      // Update mock to include the project after creation
      let projectsData = [project];
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'ai-code-editor-projects') {
          return JSON.stringify(projectsData);
        }
        return null;
      });
      
      // Mock setItem to update our data
      localStorageMock.setItem.mockImplementation((key, value) => {
        if (key === 'ai-code-editor-projects') {
          projectsData = JSON.parse(value);
        }
      });
      
      await fileManager.createFile(project.id, 'test.js', 'original content');
      
      // Simulate multiple operations
      await fileManager.updateFile(project.id, 'test.js', 'updated content');
      const file = await fileManager.getFile(project.id, 'test.js');
      
      expect(file?.content).toBe('updated content');
      expect(file?.path).toBe('test.js');
      expect(file?.language).toBe('javascript');
    });

    it('handles concurrent file operations', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const project = await fileManager.createProject('Test Project');
      localStorageMock.getItem.mockReturnValue(JSON.stringify([project]));
      
      // Simulate concurrent file creation
      const promises = [
        fileManager.createFile(project.id, 'file1.js', 'content1'),
        fileManager.createFile(project.id, 'file2.js', 'content2'),
        fileManager.createFile(project.id, 'file3.js', 'content3')
      ];
      
      const files = await Promise.all(promises);
      
      expect(files).toHaveLength(3);
      expect(files[0].name).toBe('file1.js');
      expect(files[1].name).toBe('file2.js');
      expect(files[2].name).toBe('file3.js');
    });
  });
});