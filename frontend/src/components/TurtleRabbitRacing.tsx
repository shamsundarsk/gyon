import React, { useState, useEffect } from 'react';
import './TurtleRabbitRacing.css';

interface TurtleRabbitRacingProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
}

export const TurtleRabbitRacing: React.FC<TurtleRabbitRacingProps> = ({
  isVisible,
  title = "Generating Your Perfect API Combination...",
  subtitle = "Our AI is analyzing thousands of possibilities to create something amazing for you."
}) => {
  const [raceProgress, setRaceProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "🔍 Scanning API registry...",
    "🧠 AI analyzing compatibility...",
    "⚡ Finding perfect combinations...",
    "🎯 Optimizing for your needs...",
    "✨ Almost ready..."
  ];

  useEffect(() => {
    if (!isVisible) return;

    // Reset progress when component becomes visible
    setRaceProgress(0);
    setCurrentMessage(0);

    // Animate the race progress
    const progressInterval = setInterval(() => {
      setRaceProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 3 + 1; // Random progress increment
      });
    }, 200);

    // Cycle through messages
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isVisible, messages.length]);

  if (!isVisible) return null;

  return (
    <div className="turtle-rabbit-racing-overlay">
      <div className="racing-container">
        {/* Header */}
        <div className="racing-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {/* Race Track */}
        <div className="race-track">
          <div className="track-background">
            <div className="track-line"></div>
            <div className="track-grass"></div>
          </div>
          
          {/* Finish Line */}
          <div className="finish-line">
            <div className="finish-flag">🏁</div>
          </div>

          {/* Turtle */}
          <div 
            className="racer turtle"
            style={{ 
              transform: `translateX(${Math.min(raceProgress * 0.8, 80)}%)` 
            }}
          >
            <div className="racer-character">🐢</div>
            <div className="racer-label">Stability</div>
          </div>

          {/* Rabbit */}
          <div 
            className="racer rabbit"
            style={{ 
              transform: `translateX(${Math.min(raceProgress * 1.2, 95)}%)` 
            }}
          >
            <div className="racer-character">🐰</div>
            <div className="racer-label">Speed</div>
          </div>

          {/* Progress indicators */}
          <div className="progress-dots">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className={`progress-dot ${raceProgress > i * 10 ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Status Message */}
        <div className="racing-status">
          <div className="status-message">
            {messages[currentMessage]}
          </div>
          <div className="progress-percentage">
            {Math.round(raceProgress)}%
          </div>
        </div>

        {/* Fun Facts */}
        <div className="racing-facts">
          <div className="fact-item">
            <span className="fact-icon">🎯</span>
            <span>Analyzing {Math.floor(raceProgress * 50 + 100)}+ API combinations</span>
          </div>
          <div className="fact-item">
            <span className="fact-icon">⚡</span>
            <span>Processing at {Math.floor(raceProgress * 10 + 50)} ops/sec</span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="loading-animation">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurtleRabbitRacing;