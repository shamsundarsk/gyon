import React, { useState, useEffect } from 'react';
import CodeEditor, { CodeFile } from './CodeEditor';
import FileExplorer, { FileNode } from './FileExplorer';
import FileTabs from './FileTabs';
import ProjectSwitcher from './ProjectSwitcher';
import ProjectTemplateSelector from './ProjectTemplateSelector';
import Console from './Console';
import CodeRunner from './CodeRunner';

import Terminal from './Terminal';
import SmartAIAssistant from './SmartAIAssistant';
import { useFileManager } from '../hooks/useFileManager';
import { projectImportService } from '../services/ProjectImportService';
import { ProjectTemplate } from '../services/ProjectTemplates';
import { ProjectExportService } from '../services/ProjectExportService';
import { Project } from '../services/FileManager';
import { MashupResponse } from '../types';
import { ExecutionResult } from '../services/CodeExecutionService';
import ProjectGallery from './ProjectGallery';
import ProjectSharingDialog from './ProjectSharingDialog';
import { ProjectTemplate as SharingProjectTemplate, ProjectFile } from '../services/ProjectSharingService';
import './CodeEditorPage.css';

interface CodeEditorPageProps {
  onBack?: () => void;
  mashupData?: MashupResponse | null;
  initialProject?: {
    name: string;
    files: FileNode[];
  };
}

export const CodeEditorPage: React.FC<CodeEditorPageProps> = ({
  onBack,
  mashupData,
  initialProject
}) => {
  const [openFiles, setOpenFiles] = useState<CodeFile[]>([]);
  const [activeFile, setActiveFile] = useState<CodeFile | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [importedProject, setImportedProject] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);
  const [isBottomPanelVisible, setIsBottomPanelVisible] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<'console' | 'runner' | 'terminal'>('console');
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const [showProjectGallery, setShowProjectGallery] = useState(false);
  const [showSharingDialog, setShowSharingDialog] = useState(false);

  const {
    projects,
    activeProject,
    isLoading,
    error,
    createProject,
    loadProject,
    deleteProject,
    createFile,
    createFolder,
    updateFile,
    deleteFile,
    clearError
  } = useFileManager();

  // const templatesService = ProjectTemplatesService.getInstance();
  const exportService = ProjectExportService.getInstance();

  // Import mashup project if available
  useEffect(() => {
    const importMashupProject = async () => {
      if (mashupData && !importedProject && !importLoading) {
        setImportLoading(true);
        setImportError(null);
        
        try {
          const imported = await projectImportService.importMashupProject(mashupData);
          setImportedProject(imported);
          
          // Set the first file as active and open it
          if (imported.files.length > 0) {
            const firstFile = imported.files[0];
            setOpenFiles([firstFile]);
            setActiveFile(firstFile);
          }
        } catch (err) {
          console.error('Failed to import mashup project:', err);
          setImportError(err instanceof Error ? err.message : 'Failed to import project');
        } finally {
          setImportLoading(false);
        }
      }
    };

    importMashupProject();
  }, [mashupData, importedProject, importLoading]);

  // Initialize project if needed (fallback for non-mashup projects)
  useEffect(() => {
    const initializeProject = async () => {
      if (!activeProject && !isLoading && !mashupData && !importedProject) {
        try {
          if (initialProject) {
            // Create project from initial data
            await createProject(initialProject.name, 'Imported from API mashup');
          } else {
            // Create default project
            await createProject('My Project', 'A new project created with AI Code Editor');
          }
        } catch (err) {
          console.error('Failed to initialize project:', err);
        }
      }
    };

    initializeProject();
  }, [activeProject, isLoading, initialProject, createProject, mashupData, importedProject]);

  const handleFileSelect = (file: CodeFile | FileNode) => {
    let codeFile: CodeFile;
    
    // Convert FileNode to CodeFile if needed
    if ('type' in file && file.type === 'file') {
      // First try to find the corresponding CodeFile from imported project
      const importedFile = importedProject?.files.find((f: CodeFile) => f.path === file.path);
      if (importedFile) {
        codeFile = importedFile;
      } else {
        // Create a CodeFile from FileNode (use content if available)
        codeFile = {
          id: file.path.replace(/[^a-zA-Z0-9]/g, '_'),
          name: file.name,
          content: file.content || '// New file\n',
          language: getLanguageFromPath(file.path),
          path: file.path,
        };
      }
    } else {
      codeFile = file as CodeFile;
    }
    
    // Add to open files if not already open
    if (!openFiles.find(f => f.id === codeFile.id)) {
      setOpenFiles(prev => [...prev, codeFile]);
    }
    setActiveFile(codeFile);
  };

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'html': 'html',
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  const convertToFileNodes = (files: CodeFile[]): FileNode[] => {
    const fileMap = new Map<string, FileNode>();
    const rootNodes: FileNode[] = [];

    // Create directory structure
    files.forEach(file => {
      const pathParts = file.path.split('/');
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        const isFile = index === pathParts.length - 1;
        const fullPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!fileMap.has(fullPath)) {
          const node: FileNode = {
            id: fullPath.replace(/[^a-zA-Z0-9]/g, '_'),
            name: part,
            type: isFile ? 'file' : 'folder',
            path: fullPath,
            children: isFile ? undefined : [],
            // Include content for files
            content: isFile ? file.content : undefined,
          };
          
          fileMap.set(fullPath, node);
          
          if (currentPath === '') {
            rootNodes.push(node);
          } else {
            const parent = fileMap.get(currentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }
        
        currentPath = fullPath;
      });
    });

    return rootNodes;
  };

  const handleFileChange = async (updatedFile: CodeFile) => {
    // Update the file in openFiles
    setOpenFiles(prev => 
      prev.map(f => f.id === updatedFile.id ? updatedFile : f)
    );
    
    // Save to file manager
    try {
      await updateFile(updatedFile.path, updatedFile.content);
    } catch (err) {
      console.error('Failed to save file:', err);
    }
    
    setActiveFile(updatedFile);
  };

  const handleFileClose = (file: CodeFile) => {
    const newOpenFiles = openFiles.filter(f => f.id !== file.id);
    setOpenFiles(newOpenFiles);
    
    if (activeFile?.id === file.id) {
      // Set the next active file
      const currentIndex = openFiles.findIndex(f => f.id === file.id);
      if (newOpenFiles.length > 0) {
        const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        setActiveFile(newOpenFiles[nextIndex] || null);
      } else {
        setActiveFile(null);
      }
    }
  };

  const handleFileCloseAll = () => {
    setOpenFiles([]);
    setActiveFile(null);
  };

  const handleFileCreate = async (path: string, type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        await createFile(path);
      } else {
        await createFolder(path);
      }
    } catch (err) {
      console.error('Failed to create file/folder:', err);
    }
  };

  const handleFileDelete = async (path: string) => {
    try {
      await deleteFile(path);
      
      // Close if open
      const fileToClose = openFiles.find(f => f.path === path);
      if (fileToClose) {
        handleFileClose(fileToClose);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  // Project management handlers
  const handleProjectSelect = async (project: Project) => {
    try {
      await loadProject(project.id);
      // Clear current open files when switching projects
      setOpenFiles([]);
      setActiveFile(null);
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const handleProjectCreate = () => {
    setShowTemplateSelector(true);
  };

  const handleTemplateSelect = async (template: ProjectTemplate | null, projectName: string, description: string) => {
    try {
      let newProject: Project;
      
      if (template) {
        // Create project from template
        newProject = await createProject(projectName, description);
        
        // Add template files to the project
        // This would require extending the FileManager to support bulk file creation
        // For now, we'll create a basic project and let the user know about the template
        console.log('Template selected:', template.name);
      } else {
        // Create blank project
        newProject = await createProject(projectName, description);
      }
      
      setShowTemplateSelector(false);
      
      // Open the first file if available
      if (newProject.files.length > 0) {
        const firstFile = findFirstFile(newProject.files);
        if (firstFile) {
          handleFileSelect(firstFile);
        }
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleProjectDelete = async (project: Project) => {
    try {
      await deleteProject(project.id);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleProjectExport = async (project: Project) => {
    try {
      await exportService.exportProject(project, { format: 'zip' });
    } catch (err) {
      console.error('Failed to export project:', err);
      alert('Failed to export project. Please try again.');
    }
  };

  const handleImportFromGallery = async (template: SharingProjectTemplate) => {
    try {
      // Create a new project with the template name and description
      const newProject = await createProject(template.name, template.description);
      
      // Load the project to make it active
      await loadProject(newProject.id);
      
      // Create files from template
      for (const file of template.files) {
        await createFile(file.path, file.content);
      }
      
      setShowProjectGallery(false);
      
      // Open the first file
      if (template.files.length > 0) {
        const firstFile = template.files[0];
        const codeFile: CodeFile = {
          id: firstFile.path,
          name: firstFile.path.split('/').pop() || firstFile.path,
          content: firstFile.content,
          language: firstFile.language,
          path: firstFile.path,
        };
        setOpenFiles([codeFile]);
        setActiveFile(codeFile);
      }
    } catch (err) {
      console.error('Failed to import project from gallery:', err);
      alert('Failed to import project. Please try again.');
    }
  };

  const handleProjectShared = (shareUrl: string) => {
    console.log('Project shared successfully:', shareUrl);
    // Could show a success notification here
  };

  const getCurrentProjectFiles = (): ProjectFile[] => {
    return openFiles.map(file => ({
      path: file.path || file.name,
      content: file.content,
      language: file.language,
      lastModified: new Date(),
    }));
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleExecutionComplete = (result: ExecutionResult) => {
    // Switch to console tab to show results
    if (result.errors.length > 0 || result.output.length > 0) {
      setActiveBottomTab('console');
      setIsBottomPanelVisible(true);
    }
  };

  const handleToggleBottomPanel = () => {
    setIsBottomPanelVisible(!isBottomPanelVisible);
  };



  // Helper function to find the first file in a file tree
  const findFirstFile = (files: FileNode[]): FileNode | null => {
    for (const file of files) {
      if (file.type === 'file') {
        return file;
      } else if (file.children) {
        const found = findFirstFile(file.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 600) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setIsResizingBottom(false);
  };

  const handleBottomMouseDown = (e: React.MouseEvent) => {
    setIsResizingBottom(true);
    e.preventDefault();
  };

  const handleBottomMouseMove = (e: MouseEvent) => {
    if (!isResizingBottom) return;
    
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 150 && newHeight <= 600) {
      setBottomPanelHeight(newHeight);
    }
  };

  useEffect(() => {
    const handleMouseMoveWrapper = (e: MouseEvent) => {
      handleMouseMove(e);
      handleBottomMouseMove(e);
    };

    if (isResizing || isResizingBottom) {
      document.addEventListener('mousemove', handleMouseMoveWrapper);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveWrapper);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, isResizingBottom]);

  if (isLoading || importLoading) {
    return (
      <div className="code-editor-page">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>{importLoading ? 'Importing mashup project...' : 'Loading project...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code-editor-page">
      {(error || importError) && (
        <div className="error-banner">
          <span className="error-message">{error || importError}</span>
          <button className="error-close" onClick={() => {
            clearError();
            setImportError(null);
          }}>×</button>
        </div>
      )}
      
      <div className="editor-header">
        <div className="header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ← Back to Generator
            </button>
          )}
          <h1 className="editor-title">AI Code Editor</h1>
          <ProjectSwitcher
            projects={projects}
            activeProject={activeProject}
            onProjectSelect={handleProjectSelect}
            onProjectCreate={handleProjectCreate}
            onProjectDelete={handleProjectDelete}
            onProjectExport={handleProjectExport}
            isLoading={isLoading}
          />
        </div>
        <div className="header-right">
          <button 
            className="gallery-button" 
            title="Browse Project Gallery"
            onClick={() => setShowProjectGallery(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Gallery
          </button>
          <button 
            className="share-button" 
            title="Share Project"
            onClick={() => setShowSharingDialog(true)}
            disabled={!activeProject || openFiles.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
          <button 
            className="theme-toggle" 
            title="Toggle theme"
            onClick={handleThemeToggle}
          >
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="editor-layout">
        <div 
          className="sidebar" 
          style={{ width: `${sidebarWidth}px` }}
        >
          <FileExplorer
            files={importedProject ? convertToFileNodes(importedProject.files) : (activeProject?.files || [])}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFileDelete={handleFileDelete}
            selectedFile={activeFile}
          />
        </div>
        
        <div 
          className="resize-handle"
          onMouseDown={handleMouseDown}
        />
        
        <div className="main-content">
          <div className="editor-section">
            <FileTabs
              openFiles={openFiles}
              activeFile={activeFile}
              onFileSelect={setActiveFile}
              onFileClose={handleFileClose}
              onFileCloseAll={handleFileCloseAll}
            />
            
            <div className="editor-with-ai">
              <div className="monaco-editor-container">
                <CodeEditor
                  file={activeFile}
                  onFileChange={handleFileChange}
                  onRunCode={(_file) => {
                    setActiveBottomTab('runner');
                    setIsBottomPanelVisible(true);
                    // The CodeRunner will handle the actual execution
                  }}
                  height="100%"
                  theme={theme}
                />
              </div>
              
              <div className="ai-assistant-container">
                <SmartAIAssistant
                  isOpen={true}
                  onClose={() => {}}
                  currentFile={activeFile ? {
                    name: activeFile.name,
                    content: activeFile.content,
                    language: activeFile.language,
                  } : undefined}
                  onCodeInsert={(code) => {
                    if (activeFile) {
                      const updatedFile = {
                        ...activeFile,
                        content: activeFile.content + '\n' + code
                      };
                      handleFileChange(updatedFile);
                    }
                  }}
                  onCodeReplace={(oldCode, newCode) => {
                    if (activeFile) {
                      const updatedFile = {
                        ...activeFile,
                        content: activeFile.content.replace(oldCode, newCode)
                      };
                      handleFileChange(updatedFile);
                    }
                  }}
                  selectedText=""
                  cursorPosition={{ line: 0, column: 0 }}
                />
              </div>
            </div>
          </div>
          
          {isBottomPanelVisible && (
            <>
              <div 
                className="bottom-resize-handle"
                onMouseDown={handleBottomMouseDown}
              />
              
              <div 
                className="bottom-panel"
                style={{ height: `${bottomPanelHeight}px` }}
              >
                <div className="bottom-panel-header">
                  <div className="bottom-panel-tabs">
                    <button
                      className={`bottom-tab ${activeBottomTab === 'console' ? 'active' : ''}`}
                      onClick={() => setActiveBottomTab('console')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                      Console
                    </button>
                    <button
                      className={`bottom-tab ${activeBottomTab === 'runner' ? 'active' : ''}`}
                      onClick={() => setActiveBottomTab('runner')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5,3 19,12 5,21"/>
                      </svg>
                      Runner
                    </button>

                    <button
                      className={`bottom-tab ${activeBottomTab === 'terminal' ? 'active' : ''}`}
                      onClick={() => setActiveBottomTab('terminal')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="4,17 10,11 4,5"/>
                        <line x1="12" y1="19" x2="20" y2="19"/>
                      </svg>
                      Terminal
                    </button>
                  </div>
                  
                  <button
                    className="bottom-panel-close"
                    onClick={handleToggleBottomPanel}
                    title="Hide bottom panel"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="bottom-panel-content">
                  {activeBottomTab === 'console' && (
                    <Console />
                  )}
                  {activeBottomTab === 'runner' && (
                    <CodeRunner
                      file={activeFile}
                      onExecutionComplete={handleExecutionComplete}
                    />
                  )}

                  {activeBottomTab === 'terminal' && (
                    <Terminal />
                  )}
                </div>
              </div>
            </>
          )}
          
          {!isBottomPanelVisible && (
            <div className="bottom-panel-toggle">
              <button
                className="show-bottom-panel"
                onClick={handleToggleBottomPanel}
                title="Show bottom panel"
              >
                🔼 Show Panel
              </button>
            </div>
          )}
        </div>
      </div>

      <ProjectTemplateSelector
        isOpen={showTemplateSelector}
        onTemplateSelect={handleTemplateSelect}
        onCancel={() => setShowTemplateSelector(false)}
      />

      {showProjectGallery && (
        <ProjectGallery
          onImportProject={handleImportFromGallery}
          onClose={() => setShowProjectGallery(false)}
        />
      )}

      {showSharingDialog && activeProject && (
        <ProjectSharingDialog
          projectName={activeProject.name}
          projectFiles={getCurrentProjectFiles()}
          onClose={() => setShowSharingDialog(false)}
          onShared={handleProjectShared}
        />
      )}
    </div>
  );
};

export default CodeEditorPage;