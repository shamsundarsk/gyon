import React, { useState } from 'react';
import { ProjectTemplate, ProjectTemplatesService } from '../services/ProjectTemplates';
import './ProjectTemplateSelector.css';

interface ProjectTemplateSelectorProps {
  onTemplateSelect: (template: ProjectTemplate | null, projectName: string, description: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const ProjectTemplateSelector: React.FC<ProjectTemplateSelectorProps> = ({
  onTemplateSelect,
  onCancel,
  isOpen
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const templatesService = ProjectTemplatesService.getInstance();
  const templates = templatesService.getTemplates();
  const categories = ['All', ...templatesService.getCategories()];

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const handleTemplateClick = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    if (!projectName) {
      setProjectName(`My ${template.name} Project`);
    }
    if (!projectDescription) {
      setProjectDescription(template.description);
    }
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    onTemplateSelect(selectedTemplate, projectName.trim(), projectDescription.trim());
    
    // Reset form
    setSelectedTemplate(null);
    setProjectName('');
    setProjectDescription('');
    setSelectedCategory('All');
  };

  const handleCancel = () => {
    setSelectedTemplate(null);
    setProjectName('');
    setProjectDescription('');
    setSelectedCategory('All');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="template-selector-modal">
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>

        <div className="modal-content">
          <div className="template-section">
            <h3>Choose a Template</h3>
            
            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="templates-grid">
              <div 
                className={`template-card blank-template ${!selectedTemplate ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(null)}
              >
                <div className="template-icon">📄</div>
                <div className="template-info">
                  <h4>Blank Project</h4>
                  <p>Start with an empty project</p>
                </div>
              </div>

              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="template-icon">{template.icon}</div>
                  <div className="template-info">
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <span className="template-category">{template.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="project-details">
            <h3>Project Details</h3>
            
            <div className="form-group">
              <label htmlFor="projectName">Project Name *</label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="projectDescription">Description</label>
              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description (optional)"
                rows={3}
              />
            </div>

            {selectedTemplate && (
              <div className="template-preview">
                <h4>Template: {selectedTemplate.name}</h4>
                <p>{selectedTemplate.description}</p>
                {selectedTemplate.dependencies && (
                  <div className="dependencies">
                    <strong>Dependencies:</strong>
                    <ul>
                      {Object.entries(selectedTemplate.dependencies).map(([name, version]) => (
                        <li key={name}>{name}@{version}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="create-btn" 
            onClick={handleCreateProject}
            disabled={!projectName.trim()}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectTemplateSelector;