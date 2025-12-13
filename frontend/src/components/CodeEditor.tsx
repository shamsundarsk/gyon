import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { monacoAIProvider } from '../services/MonacoAIProvider';
import { aiAssistanceService } from '../services/ai-assistance.service';
import { performanceOptimizer } from '../services/PerformanceOptimizer';
import { accessibilityService } from '../services/AccessibilityService';
import { inlineAIProvider } from '../services/InlineAIProvider';
import { proactiveAIAnalyzer, CodeIssue, SmartSuggestion } from '../services/ProactiveAIAnalyzer';
import ProgressIndicator, { useProgress } from './ProgressIndicator';
import SmartAIAssistant from './SmartAIAssistant';
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
  onRunCode?: (file: CodeFile) => void;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  height?: string;
  width?: string;
  enableAI?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onFileChange,
  onRunCode,
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
  const [, setShowFindReplace] = useState(false);
  const [syntaxErrors, setSyntaxErrors] = useState<monaco.editor.IMarkerData[]>([]);
  const [isLazyLoaded, setIsLazyLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 0, column: 0 });
  const [codeIssues, setCodeIssues] = useState<CodeIssue[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const aiProgress = useProgress();

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Get file size for performance optimization
    const fileSize = file ? new Blob([file.content]).size : 0;
    const optimizedOptions = performanceOptimizer.getOptimizedMonacoOptions(fileSize);
    
    // Check if file should be lazy loaded
    if (file && performanceOptimizer.shouldLazyLoad(fileSize)) {
      setIsLazyLoaded(true);
      const lazyFile = performanceOptimizer.createLazyLoadedFile(
        file.id,
        file.name,
        file.path,
        file.content
      );
      // Load preview content initially
      editor.setValue(lazyFile.previewContent);
    }

    // Configure editor options with performance optimizations
    const baseOptions = {
      fontSize: 14,
      fontFamily: 'Fira Code, Monaco, Consolas, "Courier New", monospace',
      lineNumbers: 'on' as const,
      tabSize: 2,
      insertSpaces: true,
      readOnly: readOnly,
      
      // Accessibility enhancements
      accessibilitySupport: 'on' as const,
      ariaLabel: `Code editor for ${file?.name || 'untitled file'}`,
      // Enhanced editor features
      formatOnPaste: true,
      formatOnType: true,
      autoIndent: 'full' as const,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      },
      // Additional advanced features
      multiCursorModifier: 'ctrlCmd' as const,
      selectionHighlight: true,
      occurrencesHighlight: 'singleFile' as const,
      codeLens: true,
      folding: true,
      foldingStrategy: 'indentation' as const,
      showFoldingControls: 'always' as const,
      unfoldOnClickAfterEndOfLine: false,
      renderControlCharacters: false,
      renderFinalNewline: 'on' as const,
      renderLineHighlight: 'all' as const,
      renderLineHighlightOnlyWhenFocus: false,
      renderValidationDecorations: 'on' as const,
      renderWhitespace: 'selection' as const,
      revealHorizontalRightPadding: 30,
      roundedSelection: true,
      rulers: [],
      scrollBeyondLastColumn: 5,
      selectOnLineNumbers: true,
      selectionClipboard: false,
      smoothScrolling: false,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on' as const,
      autoClosingBrackets: 'languageDefined' as const,
      autoClosingOvertype: 'auto' as const,
      autoClosingQuotes: 'languageDefined' as const,
      autoSurround: 'languageDefined' as const,
      colorDecorators: true,
      contextmenu: true,
      copyWithSyntaxHighlighting: true,
      cursorBlinking: 'blink' as const,
      cursorSmoothCaretAnimation: 'off' as const,
      cursorStyle: 'line' as const,
      cursorSurroundingLines: 0,
      cursorSurroundingLinesStyle: 'default' as const,
      cursorWidth: 0,
      disableMonospaceOptimizations: false,
      dragAndDrop: true,
      emptySelectionClipboard: true,
      extraEditorClassName: '',
      fastScrollSensitivity: 5,
      find: {
        cursorMoveOnType: true,
        seedSearchStringFromSelection: 'always' as const,
        autoFindInSelection: 'never' as const,
        addExtraSpaceOnTop: true,
        loop: true
      },
      fixedOverflowWidgets: false,
      hover: {
        enabled: true,
        delay: 300,
        sticky: true
      },
      inDiffEditor: false,
      letterSpacing: 0,
      lineHeight: 0,
      lineNumbersMinChars: 3,
      links: true,
      matchBrackets: 'always' as const,
      mouseWheelScrollSensitivity: 1,
      mouseWheelZoom: false,
      overviewRulerBorder: true,
      overviewRulerLanes: 2,
      padding: {
        top: 0,
        bottom: 0
      },
      parameterHints: {
        enabled: true,
        cycle: false
      },
      peekWidgetDefaultFocus: 'tree' as const,
      definitionLinkOpensInPeek: false,
      quickSuggestionsDelay: 10,
      readOnlyMessage: {
        value: 'Cannot edit in read-only editor'
      },
      renameOnType: false,
      showUnused: true,
      snippetSuggestions: 'top' as const,
      suggest: {
        insertMode: 'insert' as const,
        filterGraceful: true,
        localityBonus: false,
        shareSuggestSelections: false,
        snippetsPreventQuickSuggestions: true,
        showIcons: true,
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showSnippets: true,
        showUsers: true,
        showIssues: true
      },
      suggestFontSize: 0,
      suggestLineHeight: 0,
      suggestSelection: 'recentlyUsed' as const,
      tabCompletion: 'off' as const,
      useTabStops: true,
      wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?',
      wordWrapBreakAfterCharacters: '\t})]?|/&.,;¢°′″‰℃、。｡､￠，．：；？！％・･ゝゞヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻ｧｨｩｪｫｬｭｮｯｰ"〉》」』】〕）］｝｠',
      wordWrapBreakBeforeCharacters: '([{\'\"〈《「『【〔（［｛｟',
      wordWrapColumn: 80,
      wrappingIndent: 'none' as const,
      wrappingStrategy: 'simple' as const
    };
    
    // Merge with performance optimizations
    const finalOptions = { ...baseOptions, ...optimizedOptions };
    
    editor.updateOptions(finalOptions);

    // Register AI completion provider
    if (aiEnabled && aiStatus.available) {
      console.log('Registering AI completion provider...');
      monacoAIProvider.registerCompletionProvider();
      monacoAIProvider.setEnabled(true);
      
      // Initialize inline AI provider
      inlineAIProvider.initialize(editor);
      inlineAIProvider.setEnabled(true);
      
      // Add AI completion indicator
      const aiIndicator = document.createElement('div');
      aiIndicator.className = 'ai-completion-indicator';
      aiIndicator.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
          <circle cx="12" cy="5" r="2"/>
          <path d="M12 7v4"/>
        </svg>
        <span>AI</span>
      `;
      aiIndicator.title = 'AI assistance is active - Press Ctrl+Space for suggestions';
      
      const editorElement = editor.getDomNode();
      if (editorElement) {
        editorElement.appendChild(aiIndicator);
      }
    }

    // Setup syntax validation
    setupSyntaxValidation(editor);

    // Add keyboard shortcuts
    addKeyboardShortcuts(editor);
    
    // Register accessibility shortcuts
    registerAccessibilityShortcuts(editor);

    // Listen for content changes to validate syntax (debounced for performance)
    const debouncedValidation = performanceOptimizer.debounce(() => {
      validateSyntax(editor);
    }, 300);
    
    editor.onDidChangeModelContent(debouncedValidation);

    // Track selection changes for AI assistance (with error handling for tests)
    try {
      if (editor.onDidChangeCursorSelection) {
        editor.onDidChangeCursorSelection((e) => {
          const selection = e.selection;
          const model = editor.getModel();
          if (model && !selection.isEmpty()) {
            const selectedText = model.getValueInRange(selection);
            setSelectedText(selectedText);
          } else {
            setSelectedText('');
          }
        });
      }

      // Track cursor position
      if (editor.onDidChangeCursorPosition) {
        editor.onDidChangeCursorPosition((e) => {
          setCursorPosition({
            line: e.position.lineNumber,
            column: e.position.column
          });
        });
      }
    } catch (error) {
      console.warn('Failed to setup cursor tracking:', error);
    }
    
    // Record editor initialization time
    const initTime = performance.now();
    performanceOptimizer.recordMetric('editorInitTime', initTime);
  };

  const setupSyntaxValidation = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Enable built-in validation for supported languages
    try {
      // TypeScript language service configuration is deprecated in newer Monaco versions
      console.log('Language validation setup completed');
    } catch (error) {
      console.warn('Language service configuration error:', error);
    }

    // Listen for marker changes (syntax errors)
    monaco.editor.onDidChangeMarkers(([resource]) => {
      const model = editor.getModel();
      if (model && model.uri.toString() === resource.toString()) {
        const markers = monaco.editor.getModelMarkers({ resource });
        setSyntaxErrors(markers);
      }
    });
  };

  const validateSyntax = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    const model = editor.getModel();
    if (!model) return;

    const language = model.getLanguageId();
    const content = model.getValue();

    // Basic syntax validation for different languages
    const errors: monaco.editor.IMarkerData[] = [];

    try {
      switch (language) {
        case 'javascript':
        case 'typescript':
          validateJavaScript(content, errors);
          break;
        case 'json':
          validateJSON(content, errors);
          break;
        case 'css':
          validateCSS(content, errors);
          break;
        default:
          // For other languages, rely on Monaco's built-in validation
          break;
      }

      // Set custom markers
      monaco.editor.setModelMarkers(model, 'syntax-validation', errors);
    } catch (error) {
      console.warn('Syntax validation error:', error);
    }
  }, []);

  const validateJavaScript = (content: string, errors: monaco.editor.IMarkerData[]) => {
    // Basic bracket matching
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack: { char: string; line: number; column: number }[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (Object.keys(brackets).includes(char)) {
          stack.push({ char, line: lineIndex + 1, column: i + 1 });
        } else if (Object.values(brackets).includes(char)) {
          const last = stack.pop();
          if (!last || brackets[last.char as keyof typeof brackets] !== char) {
            errors.push({
              severity: monaco.MarkerSeverity.Error,
              message: `Unmatched bracket: ${char}`,
              startLineNumber: lineIndex + 1,
              startColumn: i + 1,
              endLineNumber: lineIndex + 1,
              endColumn: i + 2
            });
          }
        }
      }
    });

    // Check for unmatched opening brackets
    stack.forEach(item => {
      errors.push({
        severity: monaco.MarkerSeverity.Error,
        message: `Unmatched opening bracket: ${item.char}`,
        startLineNumber: item.line,
        startColumn: item.column,
        endLineNumber: item.line,
        endColumn: item.column + 1
      });
    });
  };

  const validateJSON = (content: string, errors: monaco.editor.IMarkerData[]) => {
    try {
      JSON.parse(content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
      errors.push({
        severity: monaco.MarkerSeverity.Error,
        message: errorMessage,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1
      });
    }
  };

  const validateCSS = (content: string, errors: monaco.editor.IMarkerData[]) => {
    // Basic CSS validation - check for unmatched braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push({
        severity: monaco.MarkerSeverity.Error,
        message: 'Unmatched CSS braces',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1
      });
    }

    // Check for common CSS syntax errors
    const lines = content.split('\n');
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Check for missing semicolons (basic check)
      if (trimmedLine.includes(':') && !trimmedLine.includes('{') && !trimmedLine.includes('}') && 
          !trimmedLine.endsWith(';') && !trimmedLine.endsWith(',') && trimmedLine.length > 0) {
        errors.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Missing semicolon',
          startLineNumber: lineIndex + 1,
          startColumn: line.length,
          endLineNumber: lineIndex + 1,
          endColumn: line.length + 1
        });
      }

      // Check for invalid property names (very basic)
      const propertyMatch = trimmedLine.match(/^([a-zA-Z-]+)\s*:/);
      if (propertyMatch) {
        const property = propertyMatch[1];
        // List of some common CSS properties for basic validation
        const validProperties = [
          'color', 'background', 'background-color', 'font-size', 'font-family', 'font-weight',
          'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'left',
          'right', 'bottom', 'z-index', 'opacity', 'visibility', 'overflow', 'text-align',
          'text-decoration', 'line-height', 'letter-spacing', 'word-spacing', 'white-space',
          'vertical-align', 'list-style', 'cursor', 'float', 'clear', 'box-sizing', 'border-radius',
          'box-shadow', 'text-shadow', 'transform', 'transition', 'animation', 'flex', 'grid'
        ];
        
        if (!validProperties.includes(property) && !property.startsWith('-webkit-') && 
            !property.startsWith('-moz-') && !property.startsWith('-ms-') && !property.startsWith('-o-')) {
          errors.push({
            severity: monaco.MarkerSeverity.Info,
            message: `Unknown CSS property: ${property}`,
            startLineNumber: lineIndex + 1,
            startColumn: 1,
            endLineNumber: lineIndex + 1,
            endColumn: property.length + 1
          });
        }
      }
    });
  };

  const addKeyboardShortcuts = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Save file
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      console.log('Save shortcut pressed');
      // Trigger save callback if available
      if (file && onFileChange) {
        onFileChange(file);
      }
    });

    // Find and Replace
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowFindReplace(true);
      editor.trigger('find', 'actions.find', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      setShowFindReplace(true);
      editor.trigger('replace', 'editor.action.startFindReplaceAction', {});
    });

    // Advanced find shortcuts
    editor.addCommand(monaco.KeyCode.F3, () => {
      editor.trigger('find', 'editor.action.nextMatchFindAction', {});
    });

    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F3, () => {
      editor.trigger('find', 'editor.action.previousMatchFindAction', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.trigger('find', 'editor.action.addSelectionToNextFindMatch', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL, () => {
      editor.trigger('find', 'editor.action.selectHighlights', {});
    });

    // Format document
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      formatDocument();
    });

    // Format selection
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      editor.trigger('format', 'editor.action.formatSelection', {});
    });

    // AI assistance shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('ai', 'editor.action.triggerSuggest', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyE, async () => {
      await explainSelectedCode(editor);
    });

    // Open AI Assistant
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA, () => {
      setShowAIAssistant(true);
    });

    // Toggle comment
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.trigger('comment', 'editor.action.commentLine', {});
    });

    // Duplicate line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyD, () => {
      editor.trigger('duplicate', 'editor.action.copyLinesDownAction', {});
    });

    // Move line up/down
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.trigger('move', 'editor.action.moveLinesUpAction', {});
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.trigger('move', 'editor.action.moveLinesDownAction', {});
    });

    // Go to line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      editor.trigger('goto', 'editor.action.gotoLine', {});
    });

    // Quick fix
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period, () => {
      editor.trigger('quickfix', 'editor.action.quickFix', {});
    });

    // Run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (file && onRunCode) {
        onRunCode(file);
      }
    });
  };

  const formatDocument = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.trigger('format', 'editor.action.formatDocument', {});
  }, []);

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

  const explainSelectedCode = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor) => {
    const selection = editor.getSelection();
    if (selection && !selection.isEmpty()) {
      const selectedText = editor.getModel()?.getValueInRange(selection);
      if (selectedText && aiStatus.available) {
        // Start progress tracking
        aiProgress.startProgress([
          { id: 'analyze', label: 'Analyzing code structure' },
          { id: 'generate', label: 'Generating explanation' },
          { id: 'format', label: 'Formatting response' }
        ]);
        
        try {
          const startTime = performance.now();
          
          aiProgress.activateStep('analyze', 'Examining code context...');
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate analysis
          aiProgress.completeStep('analyze');
          
          aiProgress.activateStep('generate', 'Requesting AI explanation...');
          const explanation = await aiAssistanceService.explainCode(selectedText, currentLanguage);
          aiProgress.completeStep('generate');
          
          aiProgress.activateStep('format', 'Preparing explanation...');
          await new Promise(resolve => setTimeout(resolve, 200)); // Simulate formatting
          aiProgress.completeStep('format');
          
          const responseTime = performance.now() - startTime;
          performanceOptimizer.recordMetric('aiResponseTime', responseTime);
          
          // Show explanation in a modal or tooltip (to be implemented)
          console.log('Code explanation:', explanation);
          alert(`Code Explanation:\n\n${explanation.explanation}`);
          
          aiProgress.finishProgress();
          accessibilityService.announce('Code explanation generated successfully');
        } catch (error) {
          console.error('Failed to explain code:', error);
          aiProgress.errorStep('generate', 'Failed to generate explanation');
          accessibilityService.announce('Failed to generate code explanation', 'assertive');
        }
      }
    }
  }, [aiStatus.available, currentLanguage, aiProgress]);

  const registerAccessibilityShortcuts = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    // Register editor-specific accessibility shortcuts
    accessibilityService.registerShortcut({
      key: 'F12',
      action: () => {
        const position = editor.getPosition();
        if (position) {
          accessibilityService.announce(`Line ${position.lineNumber}, Column ${position.column}`);
        }
      },
      description: 'Announce cursor position',
      category: 'Editor'
    });
    
    accessibilityService.registerShortcut({
      key: 'Ctrl+Shift+A',
      ctrlKey: true,
      shiftKey: true,
      action: () => explainSelectedCode(editor),
      description: 'Explain selected code with AI',
      category: 'AI Assistance'
    });
    
    accessibilityService.registerShortcut({
      key: 'Ctrl+Shift+R',
      ctrlKey: true,
      shiftKey: true,
      action: async () => {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
          const selectedText = editor.getModel()?.getValueInRange(selection);
          if (selectedText && aiStatus.available) {
            try {
              const suggestions = await aiAssistanceService.getRefactoringSuggestions(selectedText, currentLanguage);
              console.log('Refactoring suggestions:', suggestions);
              accessibilityService.announce(`${suggestions.length} refactoring suggestions available`);
            } catch (error) {
              console.error('Failed to get refactoring suggestions:', error);
              accessibilityService.announce('Failed to get refactoring suggestions', 'assertive');
            }
          }
        }
      },
      description: 'Get refactoring suggestions for selected code',
      category: 'AI Assistance'
    });
    
    // Enhance editor element with accessibility attributes
    const editorElement = editor.getDomNode();
    if (editorElement) {
      accessibilityService.enhanceElement(editorElement, {
        role: 'textbox',
        label: `Code editor for ${file?.name || 'untitled file'}`,
        description: `${currentLanguage} code editor with AI assistance ${aiStatus.available ? 'enabled' : 'disabled'}`
      });
    }
  }, [explainSelectedCode, aiStatus.available, currentLanguage, file?.name]);

  const loadCompleteFile = useCallback(async () => {
    if (file && isLazyLoaded) {
      setLoadingProgress(0);
      
      try {
        // Simulate progressive loading
        for (let i = 0; i <= 100; i += 10) {
          setLoadingProgress(i);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const completeContent = file.content; // Fallback for now
        const editor = editorRef.current;
        if (editor) {
          editor.setValue(completeContent);
          setIsLazyLoaded(false);
          accessibilityService.announce('Complete file loaded successfully');
        }
      } catch (error) {
        console.error('Failed to load complete file:', error);
        accessibilityService.announce('Failed to load complete file', 'assertive');
      } finally {
        setLoadingProgress(0);
      }
    }
  }, [file, isLazyLoaded]);

  const handleEditorChange = (value: string | undefined) => {
    if (file && onFileChange && value !== undefined) {
      const updatedFile: CodeFile = {
        ...file,
        content: value
      };
      onFileChange(updatedFile);
    }
  };

  // Check AI status on mount and periodically
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        console.log('Checking AI status...');
        const status = await aiAssistanceService.getStatus();
        console.log('AI status response:', status);
        setAiStatus({ available: status.available, loading: false });
        
        if (status.available && aiEnabled) {
          console.log('Enabling AI provider...');
          monacoAIProvider.setEnabled(true);
        } else {
          console.log('Disabling AI provider...');
          monacoAIProvider.setEnabled(false);
        }
      } catch (error) {
        console.warn('Failed to check AI status:', error);
        setAiStatus({ available: false, loading: false });
        monacoAIProvider.setEnabled(false);
      }
    };

    // Initial check
    checkAIStatus();
    
    // Periodic check every 30 seconds
    const interval = setInterval(checkAIStatus, 30000);
    
    return () => clearInterval(interval);
  }, [aiEnabled]);

  // Update AI provider when AI enabled state changes
  useEffect(() => {
    const isAIActive = aiEnabled && aiStatus.available;
    monacoAIProvider.setEnabled(isAIActive);
    inlineAIProvider.setEnabled(isAIActive);
  }, [aiEnabled, aiStatus.available]);

  // Setup proactive AI analysis
  useEffect(() => {
    const handleAnalysisResults = (issues: CodeIssue[], suggestions: SmartSuggestion[]) => {
      setCodeIssues(issues);
      setSmartSuggestions(suggestions);
    };

    proactiveAIAnalyzer.addListener(handleAnalysisResults);

    return () => {
      proactiveAIAnalyzer.removeListener(handleAnalysisResults);
    };
  }, []);

  // Trigger proactive analysis when file content changes
  useEffect(() => {
    if (file && aiEnabled && aiStatus.available) {
      proactiveAIAnalyzer.analyzeCode(file.content, currentLanguage, file.name);
    }
  }, [file?.content, currentLanguage, aiEnabled, aiStatus.available]);

  // Handle code insertion from AI Assistant
  const handleCodeInsert = useCallback((code: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const position = editor.getPosition();
    if (!position) return;

    editor.executeEdits('ai-assistant', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
      text: code,
    }]);

    // Focus back to editor
    editor.focus();
  }, []);

  // Handle code replacement from AI Assistant
  const handleCodeReplace = useCallback((oldCode: string, newCode: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Find the old code in the editor
    const matches = model.findMatches(oldCode, false, false, false, null, false);
    if (matches.length > 0) {
      const match = matches[0];
      editor.executeEdits('ai-assistant-replace', [{
        range: match.range,
        text: newCode,
      }]);
    }

    // Focus back to editor
    editor.focus();
  }, []);

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
      {/* AI Progress Indicator */}
      {aiProgress.isActive && (
        <ProgressIndicator
          steps={aiProgress.steps}
          title="AI Processing"
          onCancel={() => aiProgress.resetProgress()}
        />
      )}
      
      <div className="code-editor-header">
        <div className="file-info">
          <span className="file-name">{file.name}</span>
          <span className="file-language">{currentLanguage}</span>
          {isLazyLoaded && (
            <span className="lazy-loaded-indicator" title="Large file - showing preview">
              📄 Preview Mode
            </span>
          )}
          {syntaxErrors.length > 0 && (
            <span className="syntax-errors" title={`${syntaxErrors.length} syntax error(s)`}>
              ⚠️ {syntaxErrors.length}
            </span>
          )}
          {codeIssues.length > 0 && (
            <span className="ai-issues" title={`${codeIssues.length} AI suggestion(s)`}>
              🤖 {codeIssues.length}
            </span>
          )}
          {smartSuggestions.length > 0 && (
            <span className="smart-suggestions-indicator" title={`${smartSuggestions.length} improvement(s) available`}>
              ✨ {smartSuggestions.length}
            </span>
          )}
        </div>
        <div className="editor-toolbar">
          {isLazyLoaded && (
            <button
              className="toolbar-btn load-complete"
              onClick={loadCompleteFile}
              title="Load complete file"
              disabled={loadingProgress > 0}
            >
              {loadingProgress > 0 ? `${loadingProgress}%` : '📄 Load Full'}
            </button>
          )}
          <button
            className="toolbar-btn"
            onClick={formatDocument}
            title="Format Document (Ctrl+Shift+F)"
            aria-label="Format document"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16,3 21,3 21,8"/>
              <line x1="4" y1="7" x2="4" y2="20"/>
              <line x1="9" y1="9" x2="20" y2="9"/>
              <line x1="9" y1="15" x2="20" y2="15"/>
            </svg>
          </button>
          <button
            className="toolbar-btn"
            onClick={() => {
              const editor = editorRef.current;
              if (editor) {
                editor.trigger('find', 'actions.find', {});
              }
            }}
            title="Find (Ctrl+F)"
            aria-label="Find in document"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button
            className="toolbar-btn"
            onClick={() => {
              const editor = editorRef.current;
              if (editor) {
                editor.trigger('replace', 'editor.action.startFindReplaceAction', {});
              }
            }}
            title="Find & Replace (Ctrl+H)"
            aria-label="Find and replace"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </button>
          {aiStatus.available && (
            <button
              className="toolbar-btn ai-assistant-btn"
              onClick={() => setShowAIAssistant(true)}
              title="Open AI Assistant (Ctrl+Shift+A)"
              aria-label="Open AI Assistant"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M8 9h8M8 13h6"/>
              </svg>
            </button>
          )}
          <div className="ai-status">
            {aiStatus.loading ? (
              <span className="ai-status-loading" aria-live="polite">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Checking AI...
              </span>
            ) : aiStatus.available ? (
              <button
                className={`ai-toggle ${aiEnabled ? 'enabled' : 'disabled'}`}
                onClick={() => setAiEnabled(!aiEnabled)}
                title={aiEnabled ? 'Disable AI assistance' : 'Enable AI assistance'}
                aria-label={`AI assistance is ${aiEnabled ? 'enabled' : 'disabled'}. Click to ${aiEnabled ? 'disable' : 'enable'}.`}
                aria-pressed={aiEnabled}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                  <circle cx="12" cy="5" r="2"/>
                  <path d="M12 7v4"/>
                  <line x1="8" y1="16" x2="8" y2="16"/>
                  <line x1="16" y1="16" x2="16" y2="16"/>
                </svg>
                AI {aiEnabled ? 'ON' : 'OFF'}
              </button>
            ) : (
              <span 
                className="ai-status-unavailable" 
                title="AI assistance unavailable"
                aria-label="AI assistance is currently unavailable"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                  <circle cx="12" cy="5" r="2"/>
                  <path d="M12 7v4"/>
                  <line x1="8" y1="16" x2="8" y2="16"/>
                  <line x1="16" y1="16" x2="16" y2="16"/>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
                AI Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="code-editor-wrapper">
        <Editor
          height={height}
          width={width}
          language={currentLanguage}
          value={file.content}
          theme={theme === 'dark' ? 'minimal-dark' : 'minimal-light'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          beforeMount={(monaco) => {
            // Define custom themes
            monaco.editor.defineTheme('minimal-light', {
              base: 'vs',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '999999', fontStyle: 'italic' },
                { token: 'keyword', foreground: '333333', fontStyle: 'bold' },
                { token: 'string', foreground: '666666' },
                { token: 'number', foreground: '666666' },
                { token: 'regexp', foreground: '666666' },
                { token: 'type', foreground: '333333' },
                { token: 'class', foreground: '333333' },
                { token: 'function', foreground: '333333' },
                { token: 'variable', foreground: '333333' },
                { token: 'constant', foreground: '666666' },
                { token: 'operator', foreground: '333333' },
                { token: 'delimiter', foreground: '333333' },
              ],
              colors: {
                'editor.background': '#ffffff',
                'editor.foreground': '#333333',
                'editor.lineHighlightBackground': '#fafafa',
                'editor.selectionBackground': '#e0e0e0',
                'editor.inactiveSelectionBackground': '#f0f0f0',
                'editorCursor.foreground': '#333333',
                'editorLineNumber.foreground': '#cccccc',
                'editorLineNumber.activeForeground': '#999999',
                'editorIndentGuide.background': '#f0f0f0',
                'editorIndentGuide.activeBackground': '#e0e0e0',
                'editorWhitespace.foreground': '#f0f0f0',
                'editorRuler.foreground': '#f0f0f0',
                'scrollbarSlider.background': '#e0e0e0',
                'scrollbarSlider.hoverBackground': '#cccccc',
                'scrollbarSlider.activeBackground': '#999999',
              }
            });

            monaco.editor.defineTheme('minimal-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '888888', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'cccccc', fontStyle: 'bold' },
                { token: 'string', foreground: 'aaaaaa' },
                { token: 'number', foreground: 'aaaaaa' },
                { token: 'regexp', foreground: 'aaaaaa' },
                { token: 'type', foreground: 'cccccc' },
                { token: 'class', foreground: 'cccccc' },
                { token: 'function', foreground: 'cccccc' },
                { token: 'variable', foreground: 'cccccc' },
                { token: 'constant', foreground: 'aaaaaa' },
                { token: 'operator', foreground: 'cccccc' },
                { token: 'delimiter', foreground: 'cccccc' },
              ],
              colors: {
                'editor.background': '#1a1a1a',
                'editor.foreground': '#cccccc',
                'editor.lineHighlightBackground': '#1e1e1e',
                'editor.selectionBackground': '#444444',
                'editor.inactiveSelectionBackground': '#333333',
                'editorCursor.foreground': '#cccccc',
                'editorLineNumber.foreground': '#666666',
                'editorLineNumber.activeForeground': '#888888',
                'editorIndentGuide.background': '#333333',
                'editorIndentGuide.activeBackground': '#444444',
                'editorWhitespace.foreground': '#333333',
                'editorRuler.foreground': '#333333',
                'scrollbarSlider.background': '#444444',
                'scrollbarSlider.hoverBackground': '#555555',
                'scrollbarSlider.activeBackground': '#666666',
              }
            });
          }}
          options={{
            // Professional editor appearance
            selectOnLineNumbers: true,
            roundedSelection: true,
            readOnly: readOnly,
            cursorStyle: 'line',
            automaticLayout: true,
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 15,
            lineNumbersMinChars: 4,
            renderLineHighlight: 'all',
            
            // Minimal visual features
            fontSize: 13,
            fontFamily: "'SF Mono', 'Monaco', 'Consolas', monospace",
            fontLigatures: false,
            lineHeight: 18,
            letterSpacing: 0,
            
            // Minimal scrollbars
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            
            // Minimal minimap
            minimap: {
              enabled: false,
            },
            
            // Professional bracket matching
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              bracketPairsHorizontal: true,
              highlightActiveBracketPair: true,
              indentation: true,
              highlightActiveIndentation: true,
            },
            
            // Enhanced suggestions
            suggest: {
              showIcons: true,
              showMethods: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showKeywords: true,
              showWords: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showSnippets: true,
              insertMode: 'insert',
              filterGraceful: true,
              snippetsPreventQuickSuggestions: false,
            },
            
            // Professional hover and tooltips
            hover: {
              enabled: true,
              delay: 300,
              sticky: true,
            },
            
            // Enhanced find widget
            find: {
              cursorMoveOnType: true,
              seedSearchStringFromSelection: 'always',
              autoFindInSelection: 'never',
              addExtraSpaceOnTop: true,
              loop: true,
            },
            
            // Code lens and references
            codeLens: true,
            
            // Professional formatting
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            
            // Enhanced selection and multi-cursor
            multiCursorModifier: 'ctrlCmd',
            selectionHighlight: true,
            occurrencesHighlight: 'singleFile',
            
            // Professional whitespace and rulers
            renderWhitespace: 'selection',
            rulers: [80, 120],
            
            // Enhanced word wrapping
            wordWrap: 'off',
            wordWrapColumn: 120,
            wrappingIndent: 'indent',
            
            // Professional padding and margins
            padding: { top: 16, bottom: 16 },
            
            // Enhanced accessibility
            accessibilitySupport: 'on',
            
            // Performance optimizations
            smoothScrolling: true,
            mouseWheelZoom: true,
            fastScrollSensitivity: 5,
          }}
        />
      </div>
      
      {/* Professional Status Bar */}
      <div className="code-editor-status-bar">
        <div className="status-left">
          <span className="status-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            {currentLanguage.toUpperCase()}
          </span>
          <span className="status-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
            </svg>
            UTF-8
          </span>
          {syntaxErrors.length > 0 && (
            <span className="status-item status-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {syntaxErrors.length} error{syntaxErrors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="status-right">
          {aiStatus.available && aiEnabled && (
            <span className="status-item status-ai">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                <circle cx="12" cy="5" r="2"/>
                <path d="M12 7v4"/>
              </svg>
              AI Active
            </span>
          )}
          <span className="status-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
            </svg>
            {file.content.split('\n').length} lines
          </span>
        </div>
      </div>

      {/* Smart AI Assistant */}
      <SmartAIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        currentFile={file ? {
          name: file.name,
          content: file.content,
          language: currentLanguage,
        } : undefined}
        onCodeInsert={handleCodeInsert}
        onCodeReplace={handleCodeReplace}
        selectedText={selectedText}
        cursorPosition={cursorPosition}
      />
    </div>
  );
};

export default CodeEditor;