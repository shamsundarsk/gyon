import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CodeEditor, { CodeFile } from '../CodeEditor';

// Mock Monaco Editor completely to avoid DOM issues
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, language }: any) => (
    <div data-testid="monaco-editor">
      <div data-testid="editor-language">{language}</div>
      <div data-testid="editor-content">{value}</div>
    </div>
  )
}));

// Mock monaco-editor module
vi.mock('monaco-editor', () => ({
  KeyMod: { CtrlCmd: 1 },
  KeyCode: { KeyS: 1 }
}));

describe('CodeEditor Component', () => {
  const mockFile: CodeFile = {
    id: '1',
    name: 'test.js',
    content: 'console.log("Hello World");',
    language: 'javascript',
    path: '/test.js'
  };

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