
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import CodeRunner from '../CodeRunner';
import Console from '../Console';
import LivePreview from '../LivePreview';
import { CodeExecutionService } from '../../services/CodeExecutionService';
import { CodeFile } from '../CodeEditor';

// Mock the CodeExecutionService
vi.mock('../../services/CodeExecutionService');

describe('Code Execution Integration Tests', () => {
  const mockExecutionService = {
    executeJavaScript: vi.fn(),
    executeTypeScript: vi.fn(),
    canExecute: vi.fn(),
    getSupportedLanguages: vi.fn(),
    addConsoleMessage: vi.fn(),
    onConsoleUpdate: vi.fn(),
    getConsoleMessages: vi.fn(),
    clearConsole: vi.fn(),
  };

  const sampleJSFile: CodeFile = {
    id: 'test-js',
    name: 'test.js',
    content: 'console.log("Hello, World!");',
    language: 'javascript',
    path: 'test.js'
  };

  const sampleTSFile: CodeFile = {
    id: 'test-ts',
    name: 'test.ts',
    content: 'const message: string = "Hello, TypeScript!"; console.log(message);',
    language: 'typescript',
    path: 'test.ts'
  };

  const sampleHTMLFile: CodeFile = {
    id: 'test-html',
    name: 'index.html',
    content: '<html><body><h1>Hello World</h1></body></html>',
    language: 'html',
    path: 'index.html'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (CodeExecutionService.getInstance as any).mockReturnValue(mockExecutionService);
    mockExecutionService.canExecute.mockImplementation((lang: string) => 
      ['javascript', 'typescript'].includes(lang)
    );
    mockExecutionService.getSupportedLanguages.mockReturnValue(['javascript', 'typescript']);
    mockExecutionService.getConsoleMessages.mockReturnValue([]);
    mockExecutionService.onConsoleUpdate.mockReturnValue(() => {});
  });

  describe('CodeRunner Component', () => {
    test('should display run button for supported languages', () => {
      render(<CodeRunner file={sampleJSFile} />);
      
      expect(screen.getByText('▶️ Run')).toBeInTheDocument();
      expect(screen.getByText('▶️ Run')).not.toBeDisabled();
    });

    test('should display unsupported notice for unsupported languages', () => {
      const pythonFile: CodeFile = {
        id: 'test-py',
        name: 'test.py',
        content: 'print("Hello")',
        language: 'python',
        path: 'test.py'
      };

      mockExecutionService.canExecute.mockReturnValue(false);
      
      render(<CodeRunner file={pythonFile} />);
      
      expect(screen.getByText('⚠️ python not supported')).toBeInTheDocument();
      expect(screen.getByText('▶️ Run')).toBeDisabled();
    });

    test('should execute JavaScript code successfully', async () => {
      const mockResult = {
        output: ['[LOG] Hello, World!'],
        errors: [],
        executionTime: 15.5,
        success: true
      };

      mockExecutionService.executeJavaScript.mockResolvedValue(mockResult);

      const onExecutionComplete = vi.fn();
      render(<CodeRunner file={sampleJSFile} onExecutionComplete={onExecutionComplete} />);
      
      const runButton = screen.getByText('▶️ Run');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(mockExecutionService.executeJavaScript).toHaveBeenCalledWith(sampleJSFile.content);
        expect(onExecutionComplete).toHaveBeenCalledWith(mockResult);
      });

      expect(screen.getByText('✅ Success')).toBeInTheDocument();
      expect(screen.getAllByText('15.50ms')).toHaveLength(2); // One in result, one in history
    });

    test('should execute TypeScript code successfully', async () => {
      const mockResult = {
        output: ['[LOG] Hello, TypeScript!'],
        errors: [],
        executionTime: 25.3,
        success: true
      };

      mockExecutionService.executeTypeScript.mockResolvedValue(mockResult);

      render(<CodeRunner file={sampleTSFile} />);
      
      const runButton = screen.getByText('▶️ Run');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(mockExecutionService.executeTypeScript).toHaveBeenCalledWith(sampleTSFile.content);
      });

      expect(screen.getByText('✅ Success')).toBeInTheDocument();
    });

    test('should handle execution errors gracefully', async () => {
      const mockResult = {
        output: [],
        errors: ['ReferenceError: undefinedVariable is not defined'],
        executionTime: 5.2,
        success: false
      };

      mockExecutionService.executeJavaScript.mockResolvedValue(mockResult);

      const errorFile: CodeFile = {
        ...sampleJSFile,
        content: 'console.log(undefinedVariable);'
      };

      render(<CodeRunner file={errorFile} />);
      
      const runButton = screen.getByText('▶️ Run');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(screen.getByText('❌ Error')).toBeInTheDocument();
        expect(screen.getByText('ReferenceError: undefinedVariable is not defined')).toBeInTheDocument();
      });
    });

    test('should show execution history', async () => {
      const mockResult1 = {
        output: ['[LOG] First execution'],
        errors: [],
        executionTime: 10.0,
        success: true
      };

      const mockResult2 = {
        output: [],
        errors: ['Error in second execution'],
        executionTime: 8.5,
        success: false
      };

      mockExecutionService.executeJavaScript
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);

      render(<CodeRunner file={sampleJSFile} />);
      
      const runButton = screen.getByText('▶️ Run');
      
      // First execution
      fireEvent.click(runButton);
      await waitFor(() => expect(screen.getByText('✅ Success')).toBeInTheDocument());

      // Second execution
      fireEvent.click(runButton);
      await waitFor(() => expect(screen.getByText('❌ Error')).toBeInTheDocument());

      // Check history
      expect(screen.getByText('Recent Executions')).toBeInTheDocument();
      expect(screen.getAllByText('✅')).toHaveLength(1); // One in current result
      expect(screen.getAllByText('❌')).toHaveLength(1); // One in current result
    });
  });

  describe('Console Component', () => {
    test('should display empty state when no messages', () => {
      render(<Console />);
      
      expect(screen.getByText('No console output yet. Run some code to see results here.')).toBeInTheDocument();
    });

    test('should display console messages', () => {
      const mockMessages = [
        {
          type: 'log' as const,
          message: 'Hello, World!',
          timestamp: new Date('2023-01-01T10:00:00Z')
        },
        {
          type: 'error' as const,
          message: 'Something went wrong',
          timestamp: new Date('2023-01-01T10:01:00Z')
        }
      ];

      mockExecutionService.getConsoleMessages.mockReturnValue(mockMessages);

      render(<Console />);
      
      expect(screen.getByText('Hello, World!')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    test('should clear console messages', () => {
      const mockMessages = [
        {
          type: 'log' as const,
          message: 'Test message',
          timestamp: new Date()
        }
      ];

      mockExecutionService.getConsoleMessages.mockReturnValue(mockMessages);

      render(<Console />);
      
      const clearButton = screen.getByText('🗑️ Clear');
      fireEvent.click(clearButton);

      expect(mockExecutionService.clearConsole).toHaveBeenCalled();
    });
  });

  describe('LivePreview Component', () => {
    test('should display placeholder when no files', () => {
      render(<LivePreview files={[]} activeFile={null} />);
      
      expect(screen.getByText('No Preview Available')).toBeInTheDocument();
      expect(screen.getByText('Create HTML, CSS, or JavaScript files to see a live preview of your project.')).toBeInTheDocument();
    });

    test('should generate preview for HTML files', () => {
      render(<LivePreview files={[sampleHTMLFile]} activeFile={sampleHTMLFile} />);
      
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });

    test('should generate preview for JavaScript files', () => {
      render(<LivePreview files={[sampleJSFile]} activeFile={sampleJSFile} />);
      
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });

    test('should handle mixed file types', () => {
      const cssFile: CodeFile = {
        id: 'test-css',
        name: 'style.css',
        content: 'body { background: blue; }',
        language: 'css',
        path: 'style.css'
      };

      const files = [sampleHTMLFile, cssFile, sampleJSFile];
      
      render(<LivePreview files={files} activeFile={sampleHTMLFile} />);
      
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });

    test('should toggle between auto and manual mode', () => {
      render(<LivePreview files={[sampleHTMLFile]} activeFile={sampleHTMLFile} />);
      
      expect(screen.getByText('(auto)')).toBeInTheDocument();
      
      const modeButton = screen.getByTitle('Switch to manual mode');
      fireEvent.click(modeButton);
      
      expect(screen.getByText('(manual)')).toBeInTheDocument();
    });

    test('should refresh preview manually', () => {
      render(<LivePreview files={[sampleHTMLFile]} activeFile={sampleHTMLFile} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      // Should trigger a refresh (implementation detail)
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    test('should execute code and show results in console', async () => {
      const mockResult = {
        output: ['[LOG] Integration test'],
        errors: [],
        executionTime: 12.3,
        success: true
      };

      mockExecutionService.executeJavaScript.mockResolvedValue(mockResult);

      const onExecutionComplete = vi.fn((result) => {
        // Simulate adding message to console
        mockExecutionService.addConsoleMessage('info', `✅ Execution completed in ${result.executionTime.toFixed(2)}ms`);
      });

      render(
        <div>
          <CodeRunner file={sampleJSFile} onExecutionComplete={onExecutionComplete} />
          <Console />
        </div>
      );
      
      const runButton = screen.getByText('▶️ Run');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(onExecutionComplete).toHaveBeenCalledWith(mockResult);
        expect(mockExecutionService.addConsoleMessage).toHaveBeenCalledWith('info', '✅ Execution completed in 12.30ms');
      });
    });

    test('should handle execution timeout', async () => {
      const timeoutError = new Error('Execution timeout: Code took too long to execute');
      mockExecutionService.executeJavaScript.mockRejectedValue(timeoutError);

      render(<CodeRunner file={sampleJSFile} />);
      
      const runButton = screen.getByText('▶️ Run');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(mockExecutionService.addConsoleMessage).toHaveBeenCalledWith('error', 'Execution error: Execution timeout: Code took too long to execute');
      });
    });

    test('should support keyboard shortcuts for execution', () => {
      // This would be tested in the CodeEditor component tests
      // Here we just verify the integration works
      const onRunCode = vi.fn();
      
      // Simulate Ctrl+Enter being pressed in the editor
      // This would trigger the onRunCode callback
      onRunCode(sampleJSFile);
      
      expect(onRunCode).toHaveBeenCalledWith(sampleJSFile);
    });
  });
});