import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeEditorPage from '../CodeEditorPage';

// Mock the useFileManager hook
vi.mock('../../hooks/useFileManager', () => ({
  useFileManager: () => ({
    projects: [],
    activeProject: {
      id: 'test-project',
      name: 'Test Project',
      description: 'A test project',
      files: [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          path: 'src',
          children: [
            {
              id: 'index-js',
              name: 'index.js',
              type: 'file',
              path: 'src/index.js',
              content: 'console.log("Hello World");'
            }
          ]
        },
        {
          id: 'package-json',
          name: 'package.json',
          type: 'file',
          path: 'package.json',
          content: '{"name": "test-project", "version": "1.0.0"}'
        },
        {
          id: 'readme-md',
          name: 'README.md',
          type: 'file',
          path: 'README.md',
          content: '# Test Project\n\nA test project for the AI Code Editor.'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    isLoading: false,
    error: null,
    createProject: vi.fn(),
    loadProject: vi.fn(),
    deleteProject: vi.fn(),
    createFile: vi.fn(),
    createFolder: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    clearError: vi.fn()
  })
}));

// Mock all the child components
vi.mock('../CodeEditor', () => ({
  default: ({ file }: any) => (
    <div data-testid="code-editor">
      {file ? `Editing: ${file.name}` : 'No file selected'}
    </div>
  )
}));

vi.mock('../FileExplorer', () => ({
  default: ({ files, onFileSelect }: any) => {
    const renderFiles = (fileList: any[]): any[] => {
      const result: any[] = [];
      fileList.forEach((file: any) => {
        result.push(
          <button
            key={file.id}
            onClick={() => file.type === 'file' && onFileSelect({
              id: file.id,
              name: file.name,
              content: file.content || '',
              language: 'javascript',
              path: file.path
            })}
          >
            {file.name}
          </button>
        );
        if (file.children) {
          result.push(...renderFiles(file.children));
        }
      });
      return result;
    };

    return (
      <div data-testid="file-explorer">
        <div>File Explorer</div>
        {renderFiles(files)}
      </div>
    );
  }
}));

vi.mock('../FileTabs', () => ({
  default: ({ openFiles, activeFile }: any) => (
    <div data-testid="file-tabs">
      <div>Open Files: {openFiles.length}</div>
      {activeFile && <div>Active: {activeFile.name}</div>}
    </div>
  )
}));

vi.mock('../ProjectSwitcher', () => ({
  default: () => <div data-testid="project-switcher">Project Switcher</div>
}));

vi.mock('../ProjectTemplateSelector', () => ({
  default: () => <div data-testid="project-template-selector">Template Selector</div>
}));

vi.mock('../Console', () => ({
  default: () => <div data-testid="console">Console</div>
}));

vi.mock('../CodeRunner', () => ({
  default: () => <div data-testid="code-runner">Code Runner</div>
}));

vi.mock('../LivePreview', () => ({
  default: () => <div data-testid="live-preview">Live Preview</div>
}));

vi.mock('../ProjectGallery', () => ({
  default: () => <div data-testid="project-gallery">Project Gallery</div>
}));

vi.mock('../ProjectSharingDialog', () => ({
  default: () => <div data-testid="project-sharing-dialog">Sharing Dialog</div>
}));



// Mock services
vi.mock('../../services/ProjectImportService', () => ({
  projectImportService: {
    importMashupProject: vi.fn()
  }
}));

vi.mock('../../services/ProjectExportService', () => ({
  ProjectExportService: {
    getInstance: () => ({
      exportProject: vi.fn()
    })
  }
}));

describe('CodeEditorPage Component', () => {
  it('renders the main layout structure', () => {
    render(<CodeEditorPage />);
    
    expect(screen.getByText('AI Code Editor')).toBeInTheDocument();
    expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
    expect(screen.getByTestId('file-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('displays back button when onBack prop is provided', () => {
    const mockOnBack = vi.fn();
    render(<CodeEditorPage onBack={mockOnBack} />);
    
    const backButton = screen.getByText('← Back to Generator');
    expect(backButton).toBeInTheDocument();
    
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('does not display back button when onBack prop is not provided', () => {
    render(<CodeEditorPage />);
    
    expect(screen.queryByText('← Back to Generator')).not.toBeInTheDocument();
  });

  it('initializes with default project structure', () => {
    render(<CodeEditorPage />);
    
    // Should show default files
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('handles file selection correctly', () => {
    render(<CodeEditorPage />);
    
    // Click on a file
    const indexFile = screen.getByText('index.js');
    fireEvent.click(indexFile);
    
    // Should show the file is being edited
    expect(screen.getByText('Editing: index.js')).toBeInTheDocument();
    expect(screen.getByText('Active: index.js')).toBeInTheDocument();
  });

  it('maintains UI layout consistency across different file types', () => {
    render(<CodeEditorPage />);
    
    // Test with JavaScript file
    fireEvent.click(screen.getByText('index.js'));
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.getByTestId('file-tabs')).toBeInTheDocument();
    
    // Test with JSON file
    fireEvent.click(screen.getByText('package.json'));
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.getByTestId('file-tabs')).toBeInTheDocument();
    
    // Test with Markdown file
    fireEvent.click(screen.getByText('README.md'));
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.getByTestId('file-tabs')).toBeInTheDocument();
  });

  it('supports responsive design elements', () => {
    render(<CodeEditorPage />);
    
    // Check that main layout elements are present
    const editorPage = screen.getByText('AI Code Editor').closest('.code-editor-page');
    expect(editorPage).toBeInTheDocument();
    
    // Check that layout structure is maintained
    expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('handles theme toggle button', () => {
    render(<CodeEditorPage />);
    
    const themeToggle = screen.getByTitle('Toggle theme');
    expect(themeToggle).toBeInTheDocument();
    
    // Should be clickable
    fireEvent.click(themeToggle);
    // Note: Theme functionality would be implemented later
  });
});