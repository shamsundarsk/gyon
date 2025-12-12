import { useState, useEffect } from 'react';
import './OllamaStatus.css';
import { RobotIcon, AlertIcon } from './Icons';

interface OllamaStatusProps {
  className?: string;
}

interface OllamaStatus {
  configured: boolean;
  message: string;
}

export function OllamaStatus({ className = '' }: OllamaStatusProps) {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOllamaStatus();
    
    // Set up periodic status checks every 30 seconds
    const interval = setInterval(checkOllamaStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkOllamaStatus = async () => {
    try {
      // Use the same base URL as the API service
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
      const response = await fetch(`${baseUrl}/chatbot/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data.data);
    } catch (error) {
      console.warn('Failed to check AI status:', error);
      setStatus({
        configured: false,
        message: 'Unable to check AI status - please ensure backend is running'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`ollama-status loading ${className}`}>
        <div className="status-spinner" />
        <span>Checking AI status...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className={`ollama-status ${status.configured ? 'available' : 'unavailable'} ${className}`}>
      <div className="status-icon">
        {status.configured ? (
          <RobotIcon size={16} color="#2ecc71" />
        ) : (
          <AlertIcon size={16} color="#f39c12" />
        )}
      </div>
      <span className="status-text">{status.message}</span>
      <button 
        className="status-refresh" 
        onClick={checkOllamaStatus}
        title="Refresh AI status"
        disabled={loading}
      >
        ↻
      </button>
      {!status.configured && (
        <div className="status-help">
          <p>To enable AI features:</p>
          <ol>
            <li>Install Ollama: <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">ollama.ai</a></li>
            <li>Run: <code>ollama pull llama3</code></li>
            <li>Start: <code>ollama serve</code></li>
          </ol>
        </div>
      )}
    </div>
  );
}