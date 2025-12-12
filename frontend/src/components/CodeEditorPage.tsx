import React, { useState, useEffect } from 'react';
import CodeEditor, { CodeFile } from './CodeEditor';
import FileExplorer, { FileNode } from './FileExplorer';
import FileTabs from './FileTabs';
import { useFileManager } from '../hooks/useFileManager';
import { projectImportService } from '../services/ProjectImportService';
import { MashupResponse } from '../types';
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

  const {
    activeProject,
    isLoading,
    error,
    createProject,
    createFile,
    createFolder,
    updateFile,
    deleteFile,
    clearError
  } = useFileManager();

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
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

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
          <h1 className="editor-title">
            AI Code Editor
            {importedProject && <span className="project-name"> - {importedProject.name}</span>}
            {!importedProject && activeProject && <span className="project-name"> - {activeProject.name}</span>}
          </h1>
        </div>
        <div className="header-right">
          <button className="theme-toggle" title="Toggle theme">
            🌙
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
          <FileTabs
            openFiles={openFiles}
            activeFile={activeFile}
            onFileSelect={setActiveFile}
            onFileClose={handleFileClose}
            onFileCloseAll={handleFileCloseAll}
          />
          
          <div className="editor-area">
            <CodeEditor
              file={activeFile}
              onFileChange={handleFileChange}
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPage;