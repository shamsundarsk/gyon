import React, { useState } from 'react';
import { CodeExecutionService, ExecutionResult } from '../services/CodeExecutionService';
import { CodeFile } from './CodeEditor';
import './CodeRunner.css';

interface CodeRunnerProps {
  file: CodeFile | null;
  onExecutionStart?: () => void;
  onExecutionComplete?: (result: ExecutionResult) => void;
  className?: string;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({
  file,
  onExecutionStart,
  onExecutionComplete,
  className = ''
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  
  const executionService = CodeExecutionService.getInstance();

  const handleRunCode = async () => {
    if (!file || isExecuting) return;

    const canExecute = executionService.canExecute(file.language);
    if (!canExecute) {
      const result: ExecutionResult = {
        output: [],
        errors: [`Cannot execute ${file.language} files. Supported languages: ${executionService.getSupportedLanguages().join(', ')}`],
        executionTime: 0,
        success: false
      };
      setLastResult(result);
      onExecutionComplete?.(result);
      return;
    }

    setIsExecuting(true);
    onExecutionStart?.();

    try {
      let result: ExecutionResult;
      
      if (file.language === 'typescript') {
        result = await executionService.executeTypeScript(file.content);
      } else {
        result = await executionService.executeJavaScript(file.content);
      }

      setLastResult(result);
      setExecutionHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      onExecutionComplete?.(result);
      
      // Add execution summary to console
      const summary = result.success 
        ? `✅ Execution completed in ${result.executionTime.toFixed(2)}ms`
        : `❌ Execution failed in ${result.executionTime.toFixed(2)}ms`;
      
      executionService.addConsoleMessage(
        result.success ? 'info' : 'error',
        summary
      );
      
    } catch (error) {
      const errorResult: ExecutionResult = {
        output: [],
        errors: [error instanceof Error ? error.message : String(error)],
        executionTime: 0,
        success: false
      };
      
      setLastResult(errorResult);
      onExecutionComplete?.(errorResult);
      
      executionService.addConsoleMessage('error', `Execution error: ${errorResult.errors[0]}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = () => {
    // For now, we'll just reset the state
    // In a full implementation, you'd send a termination signal to the worker
    setIsExecuting(false);
    executionService.addConsoleMessage('warn', 'Execution stopped by user');
  };

  const formatExecutionTime = (time: number) => {
    if (time < 1000) {
      return `${time.toFixed(2)}ms`;
    }
    return `${(time / 1000).toFixed(2)}s`;
  };

  const canRun = file && executionService.canExecute(file.language);

  return (
    <div className={`code-runner ${className}`}>
      <div className="runner-header">
        <div className="runner-info">
          <span className="runner-icon">▶️</span>
          <span className="runner-title">Code Runner</span>
          {file && (
            <span className="file-info">
              {file.name} ({file.language})
            </span>
          )}
        </div>
        
        <div className="runner-controls">
          {!canRun && file && (
            <span className="unsupported-notice">
              ⚠️ {file.language} not supported
            </span>
          )}
          
          {isExecuting ? (
            <button
              className="runner-btn stop-btn"
              onClick={handleStopExecution}
              title="Stop execution"
            >
              ⏹️ Stop
            </button>
          ) : (
            <button
              className="runner-btn run-btn"
              onClick={handleRunCode}
              disabled={!canRun || isExecuting}
              title={canRun ? 'Run code (Ctrl+Enter)' : 'Language not supported for execution'}
            >
              ▶️ Run
            </button>
          )}
        </div>
      </div>

      {isExecuting && (
        <div className="execution-status">
          <div className="loading-spinner">⏳</div>
          <span>Executing code...</span>
        </div>
      )}

      {lastResult && !isExecuting && (
        <div className="execution-result">
          <div className="result-header">
            <span className={`result-status ${lastResult.success ? 'success' : 'error'}`}>
              {lastResult.success ? '✅ Success' : '❌ Error'}
            </span>
            <span className="execution-time">
              {formatExecutionTime(lastResult.executionTime)}
            </span>
          </div>
          
          {lastResult.errors.length > 0 && (
            <div className="result-errors">
              <div className="result-section-title">Errors:</div>
              {lastResult.errors.map((error, index) => (
                <div key={index} className="error-message">
                  {error}
                </div>
              ))}
            </div>
          )}
          
          {lastResult.output.length > 0 && (
            <div className="result-output">
              <div className="result-section-title">Output:</div>
              {lastResult.output.map((output, index) => (
                <div key={index} className="output-line">
                  {output}
                </div>
              ))}
            </div>
          )}
          
          {lastResult.success && lastResult.output.length === 0 && lastResult.errors.length === 0 && (
            <div className="no-output">
              Code executed successfully with no output.
            </div>
          )}
        </div>
      )}

      {executionHistory.length > 0 && (
        <div className="execution-history">
          <div className="history-header">
            <span className="history-title">Recent Executions</span>
            <button
              className="clear-history-btn"
              onClick={() => setExecutionHistory([])}
              title="Clear history"
            >
              🗑️
            </button>
          </div>
          <div className="history-list">
            {executionHistory.map((result, index) => (
              <div key={index} className="history-item">
                <span className={`history-status ${result.success ? 'success' : 'error'}`}>
                  {result.success ? '✅' : '❌'}
                </span>
                <span className="history-time">
                  {formatExecutionTime(result.executionTime)}
                </span>
                <span className="history-summary">
                  {result.success 
                    ? `${result.output.length} outputs`
                    : `${result.errors.length} errors`
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeRunner;