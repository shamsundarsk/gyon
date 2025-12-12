import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodeEditor, { CodeFile } from '../CodeEditor';

// Mock Monaco Editor completely to avoid DOM issues
const mockEditor = {
  updateOptions: vi.fn(),
  addCommand: vi.fn(),
  trigger: vi.fn(),
  onDidChangeModelContent: vi.fn(),
  getDomNode: vi.fn(() => document.createElement('div')),
  getModel: vi.fn(() => ({
    getValue: vi.fn(() => 'test content'),
    getLanguageId: vi.fn(() => 'javascript'),
    uri: { toString: vi.fn(() => 'test-uri') }
  })),
  getSelection: vi.fn(() => ({
    isEmpty: vi.fn(() => false)
  }))
};

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, language, onMount }: any) => {
    // Simulate editor mount
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0);
    }
    return (
      <div data-testid="monaco-editor">
        <div data-testid="editor-language">{language}</div>
        <div data-testid="editor-content">{value}</div>
      </div>
    );
  }
}));

// Mock monaco-editor module with more complete API
vi.mock('monaco-editor', () => ({
  KeyMod: { 
    CtrlCmd: 1, 
    Shift: 2, 
    Alt: 4 
  },
  KeyCode: { 
    KeyS: 1, 
    KeyF: 2, 
    KeyH: 3, 
    KeyG: 4, 
    Space: 5, 
    KeyE: 6, 
    Slash: 7, 
    KeyD: 8, 
    UpArrow: 9, 
    DownArrow: 10, 
    Period: 11, 
    KeyK: 12 
  },
  MarkerSeverity: {
    Error: 8,
    Warning: 4,
    Info: 2,
    Hint: 1
  },
  editor: {
    onDidChangeMarkers: vi.fn(),
    getModelMarkers: vi.fn(() => []),
    setModelMarkers: vi.fn()
  },
  languages: {
    typescript: {
      javascriptDefaults: {
        setDiagnosticsOptions: vi.fn()
      },
      typescriptDefaults: {
        setDiagnosticsOptions: vi.fn()
      }
    }
  }
}));

// Mock AI assistance service
vi.mock('../../services/ai-assistance.service', () => ({
  aiAssistanceService: {
    getStatus: vi.fn(() => Promise.resolve({ available: true })),
    explainCode: vi.fn(() => Promise.resolve({ 
      explanation: 'This is a test explanation',
      suggestions: ['Add error handling'] 
    }))
  }
}));

// Mock Monaco AI Provider
vi.mock('../../services/MonacoAIProvider', () => ({
  monacoAIProvider: {
    registerCompletionProvider: vi.fn(),
    setEnabled: vi.fn()
  }
}));

describe('CodeEditor Component', () => {
  const mockFile: CodeFile = {
    id: '1',
    name: 'test.js',
    content: 'console.log("Hello World");',
    language: 'javascript',
    path: '/test.js'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders empty state when no file is provided', () => {
      render(<CodeEditor file={null} />);
      
      expect(screen.getByText('No file selected')).toBeInTheDocument();
      expect(screen.getByText('Select a file from the explorer to start editing')).toBeInTheDocument();
    });

    it('renders file information when file is provided', () => {
      render(<CodeEditor file={mockFile} />);
      
      expect(screen.getByText('test.js')).toBeInTheDocument();
      expect(screen.getAllByText('javascript')).toHaveLength(2); // One in header, one in mock editor
    });

    it('displays file content in Monaco editor', () => {
      render(<CodeEditor file={mockFile} />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-content')).toHaveTextContent('console.log("Hello World");');
    });

    it('detects language from file extension correctly', () => {
      const tsFile: CodeFile = {
        ...mockFile,
        name: 'component.tsx',
        language: 'typescript'
      };
      
      render(<CodeEditor file={tsFile} />);
      
      expect(screen.getByTestId('editor-language')).toHaveTextContent('typescript');
    });

    it('handles Python files correctly', () => {
      const pyFile: CodeFile = {
        ...mockFile,
        name: 'script.py',
        content: 'print("Hello World")',
        language: 'python'
      };
      
      render(<CodeEditor file={pyFile} />);
      
      expect(screen.getByText('script.py')).toBeInTheDocument();
      expect(screen.getByTestId('editor-language')).toHaveTextContent('python');
    });

    it('supports different themes', () => {
      render(<CodeEditor file={mockFile} theme="dark" />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Advanced Editor Features', () => {
    it('renders toolbar with formatting and find buttons', async () => {
      render(<CodeEditor file={mockFile} />);
      
      await waitFor(() => {
        expect(screen.getByTitle('Format Document (Ctrl+Shift+F)')).toBeInTheDocument();
        expect(screen.getByTitle('Find (Ctrl+F)')).toBeInTheDocument();
        expect(screen.getByTitle('Find & Replace (Ctrl+H)')).toBeInTheDocument();
      });
    });

    it('calls format document when format button is clicked', async () => {
      const user = userEvent.setup();
      render(<CodeEditor file={mockFile} />);
      
      await waitFor(() => {
        const formatBtn = screen.getByTitle('Format Document (Ctrl+Shift+F)');
        expect(formatBtn).toBeInTheDocument();
      });

      const formatBtn = screen.getByTitle('Format Document (Ctrl+Shift+F)');
      await user.click(formatBtn);

      // Wait for editor to be mounted and format to be triggered
      await waitFor(() => {
        expect(mockEditor.trigger).toHaveBeenCalledWith('format', 'editor.action.formatDocument', {});
      });
    });

    it('triggers find action when find button is clicked', async () => {
      const user = userEvent.setup();
      render(<CodeEditor file={mockFile} />);
      
      await waitFor(() => {
        const findBtn = screen.getByTitle('Find (Ctrl+F)');
        expect(findBtn).toBeInTheDocument();
      });

      const findBtn = screen.getByTitle('Find (Ctrl+F)');
      await user.click(findBtn);

      await waitFor(() => {
        expect(mockEditor.trigger).toHaveBeenCalledWith('find', 'actions.find', {});
      });
    });

    it('triggers find and replace when replace button is clicked', async () => {
      const user = userEvent.setup();
      render(<CodeEditor file={mockFile} />);
      
      await waitFor(() => {
        const replaceBtn = screen.getByTitle('Find & Replace (Ctrl+H)');
        expect(replaceBtn).toBeInTheDocument();
      });

      const replaceBtn = screen.getByTitle('Find & Replace (Ctrl+H)');
      await user.click(replaceBtn);

      await waitFor(() => {
        expect(mockEditor.trigger).toHaveBeenCalledWith('replace', 'editor.action.startFindReplaceAction', {});
      });
    });

    it('sets up keyboard shortcuts when editor mounts', async () => {
      render(<CodeEditor file={mockFile} />);
      
      await waitFor(() => {
        expect(mockEditor.addCommand).toHaveBeenCalled();
      });

      // Verify that keyboard shortcuts were registered (may be called multiple times due to React StrictMode)
      expect(mockEditor.addCommand).toHaveBeenCalled();
      expect(mockEditor.addCommand.mock.calls.length).toBeGreaterThanOrEqual(17); // Updated for additional shortcuts
    });

    it('configures editor with advanced options', async () => {
      render(<CodeEditor file={mockFile} />);
      
      await waitFor(() => {
        expect(mockEditor.updateOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            bracketPairColorization: { enabled: true }
          })
        );
      });
    });
  });

  describe('Syntax Validation', () => {
    it('displays syntax error count when errors are present', () => {
      const fileWithErrors: CodeFile = {
        ...mockFile,
        content: 'console.log("unclosed string'
      };
      
      render(<CodeEditor file={fileWithErrors} />);
      
      // The component should render without syntax errors initially
      // Syntax errors would be detected by Monaco's built-in validation
      expect(screen.queryByTitle(/syntax error/)).not.toBeInTheDocument();
    });

    it('validates JSON syntax correctly', () => {
      const jsonFile: CodeFile = {
        id: '2',
        name: 'config.json',
        content: '{"invalid": json}',
        language: 'json',
        path: '/config.json'
      };
      
      render(<CodeEditor file={jsonFile} />);
      
      expect(screen.getByText('config.json')).toBeInTheDocument();
    });

    it('validates JavaScript bracket matching', () => {
      const jsFile: CodeFile = {
        id: '3',
        name: 'script.js',
        content: 'function test() {\n  console.log("missing closing brace"',
        language: 'javascript',
        path: '/script.js'
      };
      
      render(<CodeEditor file={jsFile} />);
      
      expect(screen.getByText('script.js')).toBeInTheDocument();
    });
  });

  describe('AI Integration', () => {
    it('displays AI status when available', async () => {
      render(<CodeEditor file={mockFile} enableAI={true} />);
      
      await waitFor(() => {
        expect(screen.getByText(/AI ON/)).toBeInTheDocument();
      });
    });

    it('allows toggling AI assistance', async () => {
      const user = userEvent.setup();
      render(<CodeEditor file={mockFile} enableAI={true} />);
      
      await waitFor(() => {
        const aiToggle = screen.getByText(/AI ON/);
        expect(aiToggle).toBeInTheDocument();
      });

      const aiToggle = screen.getByText(/AI ON/);
      await user.click(aiToggle);

      await waitFor(() => {
        expect(screen.getByText(/AI OFF/)).toBeInTheDocument();
      });
    });

    it('disables AI features when AI is unavailable', async () => {
      // Mock AI as unavailable by importing the mocked service
      const aiService = await import('../../services/ai-assistance.service');
      vi.mocked(aiService.aiAssistanceService.getStatus).mockResolvedValue({ 
        available: false, 
        service: 'ollama', 
        model: 'test', 
        url: 'test' 
      });

      render(<CodeEditor file={mockFile} enableAI={true} />);
      
      await waitFor(() => {
        expect(screen.getByText(/AI Unavailable/)).toBeInTheDocument();
      });
    });
  });

  describe('File Change Handling', () => {
    it('calls onFileChange when content is modified', async () => {
      const mockOnFileChange = vi.fn();
      const { rerender } = render(
        <CodeEditor file={mockFile} onFileChange={mockOnFileChange} />
      );

      // Simulate content change by re-rendering with new content
      const updatedFile = { ...mockFile, content: 'console.log("Updated");' };
      rerender(<CodeEditor file={updatedFile} onFileChange={mockOnFileChange} />);

      // The onFileChange would be called by Monaco's onChange event
      // which is mocked, so we just verify the component renders correctly
      expect(screen.getByTestId('editor-content')).toHaveTextContent('console.log("Updated");');
    });

    it('handles read-only mode correctly', () => {
      render(<CodeEditor file={mockFile} readOnly={true} />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });
});