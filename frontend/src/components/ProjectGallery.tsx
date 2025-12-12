/**
 * Project Gallery Component
 * Displays shared projects and templates for browsing and importing
 */

import React, { useState, useEffect } from 'react';
import { projectSharingService, ProjectTemplate } from '../services/ProjectSharingService';
import './ProjectGallery.css';

interface ProjectGalleryProps {
  onImportProject: (template: ProjectTemplate) => void;
  onClose: () => void;
}

const ProjectGallery: React.FC<ProjectGalleryProps> = ({ onImportProject, onClose }) => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sortBy: 'downloads' as 'downloads' | 'rating' | 'recent',
  });

  const categories = ['All', 'Frontend', 'Backend', 'Full Stack', 'Data Science', 'Mobile', 'Game Development'];

  useEffect(() => {
    loadTemplates();
  }, [filters]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams = {
        category: filters.category === 'All' ? undefined : filters.category,
        search: filters.search || undefined,
        sortBy: filters.sortBy,
      };

      const loadedTemplates = await projectSharingService.getProjectGallery(filterParams);
      setTemplates(loadedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (template: ProjectTemplate) => {
    try {
      onImportProject(template);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value as 'downloads' | 'rating' | 'recent' }));
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  return (
    <div className="project-gallery-overlay">
      <div className="project-gallery">
        <div className="gallery-header">
          <h2>Project Gallery</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="gallery-filters">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="category-section">
            <div className="category-buttons">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-button ${filters.category === category || (category === 'All' && !filters.category) ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category === 'All' ? '' : category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="sort-section">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="downloads">Most Downloaded</option>
              <option value="rating">Highest Rated</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>

        <div className="gallery-content">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading templates...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button onClick={loadTemplates} className="retry-button">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && templates.length === 0 && (
            <div className="empty-state">
              <p>No templates found matching your criteria.</p>
            </div>
          )}

          {!loading && !error && templates.length > 0 && (
            <div className="templates-grid">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <h3 className="template-name">{template.name}</h3>
                    <span className="template-category">{template.category}</span>
                  </div>

                  <p className="template-description">{template.description}</p>

                  <div className="template-stats">
                    <div className="rating">
                      {renderStars(template.rating)}
                      <span className="rating-value">({template.rating})</span>
                    </div>
                    <div className="downloads">
                      <span className="download-icon">⬇</span>
                      {template.downloads}
                    </div>
                  </div>

                  <div className="template-tags">
                    {template.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="template-meta">
                    <span className="author">by {template.author}</span>
                    <span className="date">
                      {template.createdAt.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="template-actions">
                    <button
                      className="import-button"
                      onClick={() => handleImport(template)}
                    >
                      Import Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectGallery;