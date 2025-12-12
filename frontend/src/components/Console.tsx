import React, { useState, useEffect, useRef } from 'react';
import { CodeExecutionService, ConsoleMessage } from '../services/CodeExecutionService';
import './Console.css';

interface ConsoleProps {
  className?: string;
}

export const Console: React.FC<ConsoleProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const executionService = CodeExecutionService.getInstance();

  useEffect(() => {
    // Subscribe to console updates
    const unsubscribe = executionService.onConsoleUpdate(setMessages);
    
    // Load existing messages
    setMessages(executionService.getConsoleMessages());
    
    return unsubscribe;
  }, [executionService]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messagesEndRef.current && messagesEndRef.current.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleClear = () => {
    executionService.clearConsole();
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className={`console ${className}`}>
      <div className="console-header">
        <div className="console-title">
          <span className="console-icon">🖥️</span>
          Console
          {messages.length > 0 && (
            <span className="message-count">({messages.length})</span>
          )}
        </div>
        <div className="console-controls">
          <button
            className="console-btn clear-btn"
            onClick={handleClear}
            title="Clear console"
            disabled={messages.length === 0}
          >
            🗑️ Clear
          </button>
          <button
            className="console-btn toggle-btn"
            onClick={handleToggleVisibility}
            title={isVisible ? 'Hide console' : 'Show console'}
          >
            {isVisible ? '🔽' : '🔼'}
          </button>
        </div>
      </div>
      
      {isVisible && (
        <div className="console-content">
          {messages.length === 0 ? (
            <div className="console-empty">
              <span className="empty-icon">💭</span>
              <p>No console output yet. Run some code to see results here.</p>
            </div>
          ) : (
            <div className="console-messages">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`console-message console-${message.type}`}
                >
                  <span className="message-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </span>
                  <span className="message-icon">
                    {getMessageIcon(message.type)}
                  </span>
                  <span className="message-text">
                    {message.message}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Console;