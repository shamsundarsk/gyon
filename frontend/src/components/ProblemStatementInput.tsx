import React, { useState } from 'react';
import './ProblemStatementInput.css';
import { LightbulbIcon, SendIcon, SparklesIcon } from './Icons';

interface ProblemStatementInputProps {
  onGenerate: (problemStatement?: string) => void;
  isLoading: boolean;
}

export function ProblemStatementInput({ onGenerate, isLoading }: ProblemStatementInputProps) {
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
    "Build a fitness app that tracks workouts and suggests exercises based on weather",
    "Create a recipe sharing platform with location-based restaurant recommendations", 
    "Design a productivity tool that combines task management with focus music",
    "Make a travel planner that integrates weather, maps, and local events",
    "Build a learning platform that gamifies education with progress tracking",
    "Create a social media app for pet owners with veterinary appointment booking"
  ];

  const handleExampleClick = (example: string) => {
    setProblemStatement(example);
    setMode('problem');
  };

  return (
    <div className="modern-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-icon">
            <SparklesIcon size={24} color="#2ecc70" />
          </div>
          <div>
            <h2 className="chat-title">Describe Your Idea</h2>
            <p className="chat-subtitle">Tell us what you want to build, and we'll find the perfect APIs</p>
          </div>
        </div>
      </div>

      {/* Suggestions Grid */}
      <div className="suggestions-container">
        <div className="suggestions-grid">
          {exampleProblems.map((example, index) => (
            <button
              key={index}
              type="button"
              className="suggestion-card"
              onClick={() => handleExampleClick(example)}
            >
              <div className="suggestion-icon">
                <LightbulbIcon size={20} color="#2ecc70" />
              </div>
              <span className="suggestion-text">{example}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-container">
          <textarea
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="Describe your project idea... (e.g., I want to build a fitness app that tracks workouts and suggests exercises based on weather)"
            className="chat-textarea"
            rows={1}
            maxLength={1000}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            type="submit"
            className={`chat-send-btn ${problemStatement.trim().length >= 10 ? 'active' : ''}`}
            disabled={isLoading || problemStatement.trim().length < 10}
          >
            {isLoading ? (
              <div className="loading-spinner-small" />
            ) : (
              <SendIcon size={20} />
            )}
          </button>
        </div>
        <div className="chat-input-footer">
          <span className="character-count">{problemStatement.length}/1000</span>
          <span className="input-hint">Press Enter to generate • Minimum 10 characters</span>
        </div>
      </form>
    </div>
  );
}