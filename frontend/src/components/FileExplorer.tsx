import React, { useState } from 'react';
import { CodeFile } from './CodeEditor';
import './FileExplorer.css';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: CodeFile) => void;
  onFileCreate: (path: string, type: 'file' | 'folder') => void;
  onFileDelete: (path: string) => void;
  selectedFile?: CodeFile | null;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  selectedFile
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (node: FileNode) => {
    if (node.type === 'file') {
      const file: CodeFile = {
        id: node.id,
        name: node.name,
        content: node.content || '',
        language: getLanguageFromExtension(node.name),
        path: node.path
      };
      onFileSelect(file);
    } else {
      toggleFolder(node.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    switch (action) {
      case 'newFile':
        const fileName = prompt('Enter file name:');
        if (fileName) {
          const newPath = contextMenu.node.type === 'folder' 
            ? `${contextMenu.node.path}/${fileName}`
            : `${contextMenu.node.path.split('/').slice(0, -1).join('/')}/${fileName}`;
          onFileCreate(newPath, 'file');
        }
        break;
      case 'newFolder':
        const folderName = prompt('Enter folder name:');
        if (folderName) {
          const newPath = contextMenu.node.type === 'folder'
            ? `${contextMenu.node.path}/${folderName}`
            : `${contextMenu.node.path.split('/').slice(0, -1).join('/')}/${folderName}`;
          onFileCreate(newPath, 'folder');
        }
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${contextMenu.node.name}?`)) {
          onFileDelete(contextMenu.node.path);
        }
        break;
    }
    setContextMenu(null);
  };

  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  const getFileIcon = (node: FileNode): React.ReactNode => {
    if (node.type === 'folder') {
      return expandedFolders.has(node.path) ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 6H10l-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/>
          <path d="M2 6h20"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
        </svg>
      );
    }
    
    const extension = node.name.split('.').pop()?.toLowerCase();
    
    // JavaScript/TypeScript files
    if (['js', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <path d="M16 13l-4 4-4-4"/>
        </svg>
      );
    }
    
    // Python files
    if (extension === 'py') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <circle cx="10" cy="12" r="2"/>
          <circle cx="14" cy="16" r="1"/>
        </svg>
      );
    }
    
    // HTML files
    if (extension === 'html') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <path d="M8 12h8M8 16h6"/>
        </svg>
      );
    }
    
    // CSS files
    if (['css', 'scss', 'sass'].includes(extension || '')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <rect x="8" y="12" width="8" height="6" rx="1"/>
        </svg>
      );
    }
    
    // JSON files
    if (extension === 'json') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <path d="M10 12h4M10 16h2"/>
        </svg>
      );
    }
    
    // Markdown files
    if (extension === 'md') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <path d="M8 12l2 2 4-4"/>
        </svg>
      );
    }
    
    // Image files
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension || '')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
      );
    }
    
    // Config files
    if (['yml', 'yaml', 'toml', 'ini', 'conf', 'config'].includes(extension || '')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      );
    }
    
    // Default file icon
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
    );
  };

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isSelected = selectedFile?.path === node.path;
    const isExpanded = expandedFolders.has(node.path);

    return (
      <div key={node.id} className="file-node">
        <div
          className={`file-item ${isSelected ? 'selected' : ''} ${node.type === 'folder' && isExpanded ? 'expanded' : ''}`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          data-type={node.type}
          data-extension={node.type === 'file' ? node.name.split('.').pop()?.toLowerCase() : undefined}
        >
          <span className="file-icon">{getFileIcon(node)}</span>
          <span className="file-name">{node.name}</span>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div className="folder-children">
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Explorer</h3>
        <div className="file-explorer-actions">
          <button
            className="action-btn"
            onClick={() => onFileCreate('new-file.js', 'file')}
            title="New File"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </button>
          <button
            className="action-btn"
            onClick={() => onFileCreate('new-folder', 'folder')}
            title="New Folder"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
              <line x1="12" y1="10" x2="12" y2="16"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="file-tree">
        {files.map(file => renderFileNode(file))}
      </div>

      {contextMenu && (
        <>
          <div 
            className="context-menu-overlay"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button onClick={() => handleContextMenuAction('newFile')}>
              New File
            </button>
            <button onClick={() => handleContextMenuAction('newFolder')}>
              New Folder
            </button>
            <hr />
            <button 
              onClick={() => handleContextMenuAction('delete')}
              className="danger"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileExplorer;