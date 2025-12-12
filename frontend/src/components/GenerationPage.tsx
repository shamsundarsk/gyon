import React, { useState } from 'react';
import { ProblemStatementInput } from './ProblemStatementInput';
import { DiceIcon, LightbulbIcon, ArrowLeftIcon, SparklesIcon } from './Icons';
import './GenerationPage.css';

interface GenerationPageProps {
  onGenerate: (problemStatement?: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const GenerationPage: React.FC<GenerationPageProps> = ({
  onGenerate,
  onBack,
  isLoading
}) => {
  const [selectedMode, setSelectedMode] = useState<'problem' | 'random' | null>(null);

  const handleRandomGenerate = () => {
    onGenerate(); // No problem statement = random generation
  };

  const handleProblemGenerate = (problemStatement?: string) => {
    if (problemStatement) {
      onGenerate(problemStatement);
    }
  };

  if (isLoading) {
    return (
      <div className="generation-page">
        <div className="generation-container">
          <div className="loading-state">
            <div className="loading-spinner">
              <SparklesIcon size={48} color="#2ecc70" />
            </div>
            <h2>Generating Your Perfect API Combination...</h2>
            <p>Our AI is analyzing thousands of possibilities to create something amazing for you.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="generation-page">
      {/* Header */}
      <header className="generation-header-nav">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <DiceIcon size={32} color="#2ecc70" />
            </div>
            <h1 className="logo-title">API Roulette</h1>
          </div>
          <button className="back-button" onClick={onBack}>
            <ArrowLeftIcon size={20} />
            Back to Home
          </button>
        </div>
      </header>

      <div className="generation-container">

        <div className="generation-header">
          <h1>Choose Your Path</h1>
          <p>How would you like to start your hackathon journey?</p>
        </div>

        {!selectedMode && (
          <div className="mode-selection">
            <div className="mode-cards">
              <button 
                className="mode-card"
                onClick={() => setSelectedMode('problem')}
              >
                <div className="mode-icon">
                  <LightbulbIcon size={48} color="#2ecc70" />
                </div>
                <h3>I Have an Idea</h3>
                <p>Tell us what you want to build and we'll find the perfect APIs for your vision</p>
                <div className="mode-badge">Recommended</div>
              </button>

              <button 
                className="mode-card"
                onClick={() => setSelectedMode('random')}
              >
                <div className="mode-icon">
                  <DiceIcon size={48} color="#14B8A6" />
                </div>
                <h3>Surprise Me</h3>
                <p>Get a random combination of APIs and let serendipity spark your creativity</p>
              </button>
            </div>
          </div>
        )}

        {selectedMode === 'problem' && (
          <div className="problem-mode">
            <button 
              className="change-mode-btn"
              onClick={() => setSelectedMode(null)}
            >
              ← Change Mode
            </button>
            <div className="problem-input-section">
              <h2>Describe Your Idea</h2>
              <p>Tell us what you want to build, and our AI will intelligently select the perfect APIs to make it happen.</p>
              <ProblemStatementInput 
                onGenerate={handleProblemGenerate} 
                isLoading={isLoading}
                placeholder="e.g., I want to build a fitness tracking app that uses music to motivate users..."
              />
            </div>
          </div>
        )}

        {selectedMode === 'random' && (
          <div className="random-mode">
            <button 
              className="change-mode-btn"
              onClick={() => setSelectedMode(null)}
            >
              ← Change Mode
            </button>
            <div className="random-section">
              <div className="random-icon">
                <DiceIcon size={64} color="#14B8A6" />
              </div>
              <h2>Ready for a Surprise?</h2>
              <p>We'll randomly select 3 powerful APIs and generate a creative project idea that combines them in unexpected ways.</p>
              <button 
                className="btn btn-primary btn-lg random-generate-btn"
                onClick={handleRandomGenerate}
              >
                <DiceIcon size={24} />
                Generate Random Mashup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};