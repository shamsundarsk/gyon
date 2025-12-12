import React, { useState, useEffect } from 'react';
import './ProgressIndicator.css';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number; // 0-100
  message?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  title?: string;
  onCancel?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  title = 'Processing...',
  onCancel,
  showDetails = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const activeStep = steps.find(step => step.status === 'active');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const hasError = steps.some(step => step.status === 'error');
  const isCompleted = steps.every(step => step.status === 'completed');

  useEffect(() => {
    if (isCompleted && !hasError) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, hasError]);

  const toggleStepDetails = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return '✅';
      case 'active':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  const getStepClass = (step: ProgressStep) => {
    return `progress-step ${step.status}`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`progress-indicator ${className}`}>
      <div className="progress-header">
        <div className="progress-title">
          <span className="progress-icon">
            {hasError ? '❌' : isCompleted ? '✅' : '⏳'}
          </span>
          <h3>{title}</h3>
        </div>
        
        <div className="progress-actions">
          {activeStep && onCancel && (
            <button 
              className="cancel-button"
              onClick={onCancel}
              title="Cancel operation"
            >
              ✕
            </button>
          )}
          <button
            className="close-button"
            onClick={() => setIsVisible(false)}
            title="Close"
            disabled={activeStep !== undefined}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="progress-overall">
        <div className="progress-bar-container">
          <div 
            className="progress-bar"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <span className="progress-text">
          {completedSteps} of {totalSteps} steps completed
        </span>
      </div>

      {activeStep && (
        <div className="active-step-info">
          <div className="active-step-label">
            <span className="step-icon">⏳</span>
            {activeStep.label}
          </div>
          {activeStep.progress !== undefined && (
            <div className="step-progress">
              <div className="step-progress-bar-container">
                <div 
                  className="step-progress-bar"
                  style={{ width: `${activeStep.progress}%` }}
                />
              </div>
              <span className="step-progress-text">{activeStep.progress}%</span>
            </div>
          )}
          {activeStep.message && (
            <div className="step-message">{activeStep.message}</div>
          )}
        </div>
      )}

      {showDetails && (
        <div className="progress-steps">
          {steps.map((step) => (
            <div key={step.id} className={getStepClass(step)}>
              <div 
                className="step-header"
                onClick={() => toggleStepDetails(step.id)}
              >
                <span className="step-icon">{getStepIcon(step)}</span>
                <span className="step-label">{step.label}</span>
                {step.progress !== undefined && step.status === 'active' && (
                  <span className="step-progress-inline">({step.progress}%)</span>
                )}
                {step.message && (
                  <button className="step-expand-button">
                    {expandedSteps.has(step.id) ? '▼' : '▶'}
                  </button>
                )}
              </div>
              
              {expandedSteps.has(step.id) && step.message && (
                <div className="step-details">
                  <div className="step-message-detail">{step.message}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasError && (
        <div className="progress-error">
          <span className="error-icon">⚠️</span>
          <span>Some operations failed. Check the details above.</span>
        </div>
      )}

      {isCompleted && !hasError && (
        <div className="progress-success">
          <span className="success-icon">🎉</span>
          <span>All operations completed successfully!</span>
        </div>
      )}
    </div>
  );
};

// Hook for managing progress state
export const useProgress = () => {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [isActive, setIsActive] = useState(false);

  const startProgress = (initialSteps: Omit<ProgressStep, 'status'>[]) => {
    const progressSteps: ProgressStep[] = initialSteps.map(step => ({
      ...step,
      status: 'pending'
    }));
    setSteps(progressSteps);
    setIsActive(true);
  };

  const updateStep = (stepId: string, updates: Partial<ProgressStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const completeStep = (stepId: string, message?: string) => {
    updateStep(stepId, { status: 'completed', progress: 100, message });
  };

  const errorStep = (stepId: string, message: string) => {
    updateStep(stepId, { status: 'error', message });
  };

  const activateStep = (stepId: string, message?: string) => {
    setSteps(prev => prev.map(step => ({
      ...step,
      status: step.id === stepId ? 'active' : 
              step.status === 'active' ? 'pending' : step.status
    })));
    if (message) {
      updateStep(stepId, { message });
    }
  };

  const finishProgress = () => {
    setIsActive(false);
  };

  const resetProgress = () => {
    setSteps([]);
    setIsActive(false);
  };

  return {
    steps,
    isActive,
    startProgress,
    updateStep,
    completeStep,
    errorStep,
    activateStep,
    finishProgress,
    resetProgress
  };
};

export default ProgressIndicator;