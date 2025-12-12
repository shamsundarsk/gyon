import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { monacoAIProvider } from '../services/MonacoAIProvider';
import { aiAssistanceService } from '../services/ai-assistance.service';
import './CodeEditor.css';

export interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
}

interface CodeEditorProps {
  file: CodeFile | null;
  onFileChange?: (file: CodeFile) => void;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  height?: string;
  width?: string;
  enableAI?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onFileChange,
  theme = 'light',
  readOnly = false,
  height = '100%',
  width = '100%',
  enableAI = true
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [aiEnabled, setAiEnabled] = useState(enableAI);
  const [aiStatus, setAiStatus] = useState<{ available: boolean; loading: boolean }>({
    available: false,
    loading: true
  });

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Fira Code, Monaco, Consolas, "Courier New", monospace',
      lineNumbers: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      readOnly: readOnly,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      }
    });

    // Register AI completion provider
    if (aiEnabled && aiStatus.available) {
      monacoAIProvider.registerCompletionProvider();
      monacoAIProvider.setEnabled(true);
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save file - will be implemented later
      console.log('Save shortcut pressed');
    });

    // Add AI assistance shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      // Trigger AI completions
      editor.trigger('ai', 'editor.action.triggerSuggest', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyE, async () => {
      // Explain selected code
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection);
        if (selectedText && aiStatus.available) {
          try {
            const explanation = await aiAssistanceService.explainCode(selectedText, currentLanguage);
            // Show explanation in a modal or tooltip (to be implemented)
            console.log('Code explanation:', explanation);
            alert(`Code Explanation:\n\n${explanation.explanation}`);
          } catch (error) {
            console.error('Failed to explain code:', error);
          }
        }
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (file && onFileChange && value !== undefined) {
      const updatedFile: CodeFile = {
        ...file,
        content: value
      };
      onFileChange(updatedFile);
    }
  };

  // Get language from file extension
  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'php': 'php',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'sh': 'shell',
      'dockerfile': 'dockerfile'
    };

    return languageMap[extension || ''] || 'plaintext';
  };

  const currentLanguage = file ? getLanguageFromExtension(file.name) : 'javascript';

  // Check AI status on mount
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const status = await aiAssistanceService.getStatus();
        setAiStatus({ available: status.available, loading: false });
        monacoAIProvider.setEnabled(status.available && aiEnabled);
      } catch (error) {
        console.warn('Failed to check AI status:', error);
        setAiStatus({ available: false, loading: false });
        monacoAIProvider.setEnabled(false);
      }
    };

    checkAIStatus();
  }, [aiEnabled]);

  // Update AI provider when AI enabled state changes
  useEffect(() => {
    monacoAIProvider.setEnabled(aiEnabled && aiStatus.available);
  }, [aiEnabled, aiStatus.available]);

  if (!file) {
    return (
      <div className="code-editor-empty">
        <div className="empty-state">
          <h3>No file selected</h3>
          <p>Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <div className="file-info">
          <span className="file-name">{file.name}</span>
          <span className="file-language">{currentLanguage}</span>
        </div>
        <div className="ai-status">
          {aiStatus.loading ? (
            <span className="ai-status-loading">Checking AI...</span>
          ) : aiStatus.available ? (
            <button
              className={`ai-toggle ${aiEnabled ? 'enabled' : 'disabled'}`}
              onClick={() => setAiEnabled(!aiEnabled)}
              title={aiEnabled ? 'Disable AI assistance' : 'Enable AI assistance'}
            >
              🤖 AI {aiEnabled ? 'ON' : 'OFF'}
            </button>
          ) : (
            <span className="ai-status-unavailable" title="AI assistance unavailable">
              🤖 AI Unavailable
            </span>
          )}
        </div>
      </div>
      
      <div className="code-editor-wrapper">
        <Editor
          height={height}
          width={width}
          language={currentLanguage}
          value={file.content}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: readOnly,
            cursorStyle: 'line',
            automaticLayout: true,
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
            },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;