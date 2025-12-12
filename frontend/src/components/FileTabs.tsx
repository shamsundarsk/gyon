import React from 'react';
import { CodeFile } from './CodeEditor';
import './FileTabs.css';

interface FileTabsProps {
  openFiles: CodeFile[];
  activeFile: CodeFile | null;
  onFileSelect: (file: CodeFile) => void;
  onFileClose: (file: CodeFile) => void;
  onFileCloseAll: () => void;
}

export const FileTabs: React.FC<FileTabsProps> = ({
  openFiles,
  activeFile,
  onFileSelect,
  onFileClose,
  onFileCloseAll
}) => {
  const getFileIcon = (file: CodeFile): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();
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

  const handleTabClick = (file: CodeFile, e: React.MouseEvent) => {
    e.preventDefault();
    onFileSelect(file);
  };

  const handleCloseClick = (file: CodeFile, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileClose(file);
  };

  const handleMiddleClick = (file: CodeFile, e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      onFileClose(file);
    }
  };

  if (openFiles.length === 0) {
    return (
      <div className="file-tabs-empty">
        <span className="empty-message">No files open</span>
      </div>
    );
  }

  return (
    <div className="file-tabs-container">
      <div className="file-tabs">
        {openFiles.map((file) => (
          <div
            key={file.id}
            className={`file-tab ${activeFile?.id === file.id ? 'active' : ''}`}
            onClick={(e) => handleTabClick(file, e)}
            onMouseDown={(e) => handleMiddleClick(file, e)}
            title={file.path}
          >
            <span className="tab-icon">{getFileIcon(file)}</span>
            <span className="tab-name">{file.name}</span>
            <button
              className="tab-close"
              onClick={(e) => handleCloseClick(file, e)}
              title="Close file"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      {openFiles.length > 1 && (
        <div className="file-tabs-actions">
          <button
            className="close-all-btn"
            onClick={onFileCloseAll}
            title="Close all files"
          >
            Close All
          </button>
        </div>
      )}
    </div>
  );
};

export default FileTabs;