import React, { useState } from 'react';
import './ProblemStatementInput.css';
import { LightbulbIcon, DiceIcon } from './Icons';

interface ProblemStatementInputProps {
  onGenerate: (problemStatement?: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ProblemStatementInput({ onGenerate, isLoading, placeholder }: ProblemStatementInputProps) {
  const [problemStatement, setProblemStatement] = useState('');
  const [mode, setMode] = useState<'problem' | 'random'>('problem');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'problem' && problemStatement.trim()) {
      onGenerate(problemStatement.trim());
    } else if (mode === 'random') {
      onGenerate();
    }
  };

  const exampleProblems = [
    "I want to build a fitness tracking app that considers weather conditions",
    "Create a social media app for sharing recipes with location-based recommendations",
    "Build a productivity tool that combines task management with music for focus",
    "Design a travel planning app that integrates weather, maps, and local events",
    "Make a learning platform that gamifies education with progress tracking"
  ];

  const handleExampleClick = (example: string) => {
    setProblemStatement(example);
    setMode('problem');
  };

  return (
    <div className="problem-input-container">
      <div className="mode-selector">
        <button
          type="button"
          className={`mode-btn ${mode === 'problem' ? 'active' : ''}`}
          onClick={() => setMode('problem')}
        >
          <LightbulbIcon size={20} />
          Solve a Problem
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'random' ? 'active' : ''}`}
          onClick={() => setMode('random')}
        >
          <DiceIcon size={20} />
          Random Inspiration
        </button>
      </div>

      <form onSubmit={handleSubmit} className="problem-form">
        {mode === 'problem' ? (
          <div className="problem-input-section">
            <label htmlFor="problemStatement" className="problem-label">
              What do you want to build? Describe your project idea or problem to solve:
            </label>
            <textarea
              id="problemStatement"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder={placeholder || "e.g., I want to build a fitness app that tracks workouts and suggests exercises based on weather conditions..."}
              className="problem-textarea"
              rows={4}
              minLength={10}
              maxLength={1000}
              required
            />
            <div className="character-count">
              {problemStatement.length}/1000 characters
            </div>
            
            <div className="examples-section">
              <p className="examples-title">Need inspiration? Try these examples:</p>
              <div className="examples-grid">
                {exampleProblems.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    className="example-btn"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="random-mode-section">
            <div className="random-description">
              <LightbulbIcon size={48} color="var(--primary-500)" />
              <h3>Random API Combination</h3>
              <p>
                Let our system surprise you! We'll randomly select 3 APIs from different 
                categories and generate a creative app idea for you to explore.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`generate-btn ${isLoading ? 'loading' : ''}`}
          disabled={isLoading || (mode === 'problem' && problemStatement.trim().length < 10)}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              Generating...
            </>
          ) : mode === 'problem' ? (
            <>
              <LightbulbIcon size={20} />
              Generate Solution
            </>
          ) : (
            <>
              <DiceIcon size={20} />
              Generate Random Mashup
            </>
          )}
        </button>
      </form>
    </div>
  );
}