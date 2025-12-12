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

  const getFileIcon = (node: FileNode): string => {
    if (node.type === 'folder') {
      return expandedFolders.has(node.path) ? '📂' : '📁';
    }
    
    const extension = node.name.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': '🟨',
      'jsx': '🟨',
      'ts': '🔷',
      'tsx': '🔷',
      'py': '🐍',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝'
    };
    return iconMap[extension || ''] || '📄';
  };

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isSelected = selectedFile?.path === node.path;
    const isExpanded = expandedFolders.has(node.path);

    return (
      <div key={node.id} className="file-node">
        <div
          className={`file-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
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
            📄
          </button>
          <button
            className="action-btn"
            onClick={() => onFileCreate('new-folder', 'folder')}
            title="New Folder"
          >
            📁
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