/**
 * Onboarding Tour Component
 * Provides guided tour and help documentation for new users
 * Validates: Requirements 1.1
 */

import React, { useState, useEffect } from 'react';
import './OnboardingTour.css';

interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Code Editor!',
    content: 'Let\'s take a quick tour to help you get started with the most powerful features of your new AI-powered development environment.',
  },
  {
    id: 'file-explorer',
    title: 'File Explorer',
    content: 'The file explorer on the left shows your project structure. You can create, rename, and delete files and folders here.',
    target: '.file-explorer',
    position: 'right',
  },
  {
    id: 'editor',
    title: 'Code Editor',
    content: 'This is where the magic happens! The Monaco editor provides syntax highlighting, auto-completion, and error detection for multiple programming languages.',
    target: '.monaco-editor',
    position: 'top',
  },
  {
    id: 'ai-assistance',
    title: 'AI Assistance',
    content: 'Get intelligent code suggestions, explanations, and fixes powered by AI. Look for the AI assistant button or use keyboard shortcuts.',
    target: '.ai-assist-btn',
    position: 'bottom',
  },
  {
    id: 'code-execution',
    title: 'Code Execution',
    content: 'Run your code directly in the browser! The console panel shows output and errors from your executed code.',
    target: '.code-runner',
    position: 'top',
  },
  {
    id: 'project-management',
    title: 'Project Management',
    content: 'Switch between projects, import from API mashups, and manage your workspace efficiently.',
    target: '.project-switcher',
    position: 'bottom',
  },
  {
    id: 'preferences',
    title: 'Customize Your Experience',
    content: 'Access user preferences to customize themes, editor settings, and AI features to match your workflow.',
    target: '.preferences-btn',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    content: 'You\'ve completed the tour! Remember, you can always access help and documentation from the help menu. Happy coding!',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const step = ONBOARDING_STEPS[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('onboarding-highlight');
      }
    };
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (highlightedElement) {
      highlightedElement.classList.add('onboarding-highlight');
      return () => {
        highlightedElement.classList.remove('onboarding-highlight');
      };
    }
  }, [highlightedElement]);

  const handleNext = () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.action) {
      step.action();
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <>
      <div className="onboarding-overlay" />
      <div className="onboarding-tour">
        <div className="onboarding-content">
          <div className="onboarding-header">
            <h2>{step.title}</h2>
            <button className="close-btn" onClick={handleSkip} aria-label="Close tour">
              ✕
            </button>
          </div>

          <div className="onboarding-body">
            <p>{step.content}</p>
          </div>

          <div className="onboarding-progress">
            <div className="progress-dots">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  className={`progress-dot ${index === currentStep ? 'active' : ''} ${
                    index < currentStep ? 'completed' : ''
                  }`}
                  onClick={() => handleStepClick(index)}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
            <span className="progress-text">
              {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          <div className="onboarding-actions">
            <button
              className="btn-secondary"
              onClick={handleSkip}
            >
              Skip Tour
            </button>
            <div className="navigation-buttons">
              <button
                className="btn-secondary"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </button>
              <button
                className="btn-primary"
                onClick={handleNext}
              >
                {isLastStep ? 'Complete' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Hook to manage onboarding state
export const useOnboarding = () => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem('ai-code-editor-onboarding-completed') === 'true';
  });

  const markOnboardingComplete = () => {
    localStorage.setItem('ai-code-editor-onboarding-completed', 'true');
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('ai-code-editor-onboarding-completed');
    setHasSeenOnboarding(false);
  };

  return {
    hasSeenOnboarding,
    markOnboardingComplete,
    resetOnboarding,
  };
};