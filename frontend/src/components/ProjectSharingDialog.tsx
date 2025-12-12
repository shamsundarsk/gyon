/**
 * Project Sharing Dialog Component
 * Allows users to share their projects and get shareable URLs
 */

import React, { useState } from 'react';
import { projectSharingService, ProjectFile } from '../services/ProjectSharingService';
import './ProjectSharingDialog.css';

interface ProjectSharingDialogProps {
  projectName: string;
  projectFiles: ProjectFile[];
  onClose: () => void;
  onShared?: (shareUrl: string) => void;
}

const ProjectSharingDialog: React.FC<ProjectSharingDialogProps> = ({
  projectName,
  projectFiles,
  onClose,
  onShared,
}) => {
  const [formData, setFormData] = useState({
    name: projectName || 'Untitled Project',
    description: '',
    isPublic: true,
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        throw new Error('Project name is required');
      }

      if (projectFiles.length === 0) {
        throw new Error('No files to share');
      }

      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const sharedProject = await projectSharingService.shareProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
        files: projectFiles,
        isPublic: formData.isPublic,
        tags,
      });

      setShareUrl(sharedProject.shareUrl || '');
      onShared?.(sharedProject.shareUrl || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share project');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewShare = () => {
    setShareUrl(null);
    setError(null);
    setCopied(false);
  };

  if (shareUrl) {
    return (
      <div className="sharing-dialog-overlay">
        <div className="sharing-dialog">
          <div className="dialog-header">
            <h2>Project Shared Successfully!</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="dialog-content">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <p>Your project "{formData.name}" has been shared successfully.</p>
            </div>

            <div className="share-url-section">
              <label htmlFor="share-url">Share URL:</label>
              <div className="url-input-group">
                <input
                  id="share-url"
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="share-url-input"
                />
                <button
                  onClick={handleCopyUrl}
                  className={`copy-button ${copied ? 'copied' : ''}`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="project-info">
              <h3>Project Details:</h3>
              <ul>
                <li><strong>Name:</strong> {formData.name}</li>
                {formData.description && (
                  <li><strong>Description:</strong> {formData.description}</li>
                )}
                <li><strong>Visibility:</strong> {formData.isPublic ? 'Public' : 'Private'}</li>
                <li><strong>Files:</strong> {projectFiles.length} file(s)</li>
                {formData.tags && (
                  <li><strong>Tags:</strong> {formData.tags}</li>
                )}
              </ul>
            </div>
          </div>

          <div className="dialog-actions">
            <button onClick={handleNewShare} className="secondary-button">
              Share Another Project
            </button>
            <button onClick={onClose} className="primary-button">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sharing-dialog-overlay">
      <div className="sharing-dialog">
        <div className="dialog-header">
          <h2>Share Project</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="dialog-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="project-name">Project Name *</label>
            <input
              id="project-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your project (optional)"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="project-tags">Tags</label>
            <input
              id="project-tags"
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas (e.g., react, typescript, frontend)"
            />
            <small className="form-help">Tags help others discover your project</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
              />
              <span className="checkbox-text">Make this project public</span>
            </label>
            <small className="form-help">
              Public projects can be discovered and imported by other users
            </small>
          </div>

          <div className="project-preview">
            <h3>Files to be shared ({projectFiles.length}):</h3>
            <div className="files-list">
              {projectFiles.slice(0, 5).map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-path">{file.path}</span>
                  <span className="file-language">{file.language}</span>
                </div>
              ))}
              {projectFiles.length > 5 && (
                <div className="file-item more-files">
                  ... and {projectFiles.length - 5} more files
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dialog-actions">
          <button onClick={onClose} className="secondary-button" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleShare} className="primary-button" disabled={loading}>
            {loading ? 'Sharing...' : 'Share Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSharingDialog;