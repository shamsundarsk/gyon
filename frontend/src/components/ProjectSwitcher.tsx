import React, { useState } from 'react';
import { Project } from '../services/FileManager';
import './ProjectSwitcher.css';

interface ProjectSwitcherProps {
  projects: Project[];
  activeProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onProjectCreate: () => void;
  onProjectDelete: (project: Project) => void;
  onProjectExport: (project: Project) => void;
  isLoading?: boolean;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  projects,
  activeProject,
  onProjectSelect,
  onProjectCreate,
  onProjectDelete,
  onProjectExport,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleProjectSelect = (project: Project) => {
    onProjectSelect(project);
    setIsOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setShowDeleteConfirm(project.id);
  };

  const handleDeleteConfirm = (project: Project) => {
    onProjectDelete(project);
    setShowDeleteConfirm(null);
  };

  const handleExportClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    onProjectExport(project);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="project-switcher">
      <button 
        className="project-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <div className="current-project">
          <span className="project-icon">📁</span>
          <span className="project-name">
            {activeProject ? activeProject.name : 'No Project'}
          </span>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="project-dropdown">
          <div className="dropdown-header">
            <h3>Projects</h3>
            <button 
              className="create-project-btn"
              onClick={() => {
                onProjectCreate();
                setIsOpen(false);
              }}
              title="Create new project"
            >
              ➕
            </button>
          </div>

          <div className="projects-list">
            {projects.length === 0 ? (
              <div className="no-projects">
                <p>No projects yet</p>
                <button 
                  className="create-first-project"
                  onClick={() => {
                    onProjectCreate();
                    setIsOpen(false);
                  }}
                >
                  Create your first project
                </button>
              </div>
            ) : (
              projects.map(project => (
                <div 
                  key={project.id}
                  className={`project-item ${activeProject?.id === project.id ? 'active' : ''}`}
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="project-info">
                    <div className="project-header">
                      <span className="project-name">{project.name}</span>
                      <div className="project-actions">
                        <button
                          className="action-btn export-btn"
                          onClick={(e) => handleExportClick(e, project)}
                          title="Export project"
                        >
                          📤
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => handleDeleteClick(e, project)}
                          title="Delete project"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {project.description && (
                      <p className="project-description">{project.description}</p>
                    )}
                    <div className="project-meta">
                      <span className="project-date">
                        Updated {formatDate(project.updatedAt)}
                      </span>
                      <span className="project-files">
                        {countFiles(project.files)} files
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Project</h3>
            <p>
              Are you sure you want to delete "{projects.find(p => p.id === showDeleteConfirm)?.name}"?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={() => {
                  const project = projects.find(p => p.id === showDeleteConfirm);
                  if (project) handleDeleteConfirm(project);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="dropdown-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Helper function to count files recursively
const countFiles = (files: any[]): number => {
  return files.reduce((count, file) => {
    if (file.type === 'file') {
      return count + 1;
    } else if (file.children) {
      return count + countFiles(file.children);
    }
    return count;
  }, 0);
};

export default ProjectSwitcher;