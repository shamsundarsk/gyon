/**
 * Inline AI Provider - Cursor/Copilot-style AI assistance
 * Provides real-time inline code suggestions and completions
 */

import * as monaco from 'monaco-editor';
import { aiAssistanceService } from './ai-assistance.service';

export interface InlineSuggestion {
  text: string;
  range: monaco.IRange;
  command?: {
    id: string;
    title: string;
  };
}

export class InlineAIProvider {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private disposables: monaco.IDisposable[] = [];
  private currentSuggestion: InlineSuggestion | null = null;
  private suggestionWidget: HTMLElement | null = null;
  private isEnabled: boolean = true;
  private debounceTimeout: number | null = null;

  /**
   * Initialize the inline AI provider with an editor instance
   */
  initialize(editor: monaco.editor.IStandaloneCodeEditor): void {
    this.editor = editor;
    this.setupInlineProvider();
    this.setupKeyboardHandlers();
    this.setupContentChangeListener();
  }

  /**
   * Setup inline completion provider
   */
  private setupInlineProvider(): void {
    if (!this.editor) return;

    try {
      // Register inline completion provider (with error handling for tests)
      if (monaco.languages.registerInlineCompletionsProvider) {
        const disposable = monaco.languages.registerInlineCompletionsProvider('*', {
          provideInlineCompletions: this.provideInlineCompletions.bind(this),
          disposeInlineCompletions: () => {
            // Cleanup inline completions if needed
          },
        });
        this.disposables.push(disposable);
      }
    } catch (error) {
      console.warn('Failed to register inline completion provider:', error);
    }

    // Setup suggestion widget
    this.createSuggestionWidget();
  }

  /**
   * Create the suggestion widget for inline completions
   */
  private createSuggestionWidget(): void {
    if (!this.editor) return;

    const editorElement = this.editor.getDomNode();
    if (!editorElement) return;

    this.suggestionWidget = document.createElement('div');
    this.suggestionWidget.className = 'inline-ai-suggestion';
    this.suggestionWidget.style.display = 'none';
    
    this.suggestionWidget.innerHTML = `
      <div class="inline-suggestion-content">
        <div class="inline-suggestion-text"></div>
        <div class="inline-suggestion-actions">
          <button class="inline-suggestion-accept" title="Accept suggestion (Tab)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </button>
          <button class="inline-suggestion-reject" title="Reject suggestion (Esc)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="inline-suggestion-source">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
          <circle cx="12" cy="5" r="2"/>
          <path d="M12 7v4"/>
        </svg>
        AI
      </div>
    `;

    editorElement.appendChild(this.suggestionWidget);

    // Add event listeners
    const acceptBtn = this.suggestionWidget.querySelector('.inline-suggestion-accept');
    const rejectBtn = this.suggestionWidget.querySelector('.inline-suggestion-reject');

    acceptBtn?.addEventListener('click', () => this.acceptSuggestion());
    rejectBtn?.addEventListener('click', () => this.rejectSuggestion());
  }

  /**
   * Setup keyboard handlers for inline suggestions
   */
  private setupKeyboardHandlers(): void {
    if (!this.editor) return;

    // Tab to accept suggestion
    this.editor.addCommand(monaco.KeyCode.Tab, () => {
      if (this.currentSuggestion) {
        this.acceptSuggestion();
        return;
      }
      // Let Monaco handle normal tab behavior
      this.editor?.trigger('keyboard', 'tab', {});
    });

    // Escape to reject suggestion
    this.editor.addCommand(monaco.KeyCode.Escape, () => {
      if (this.currentSuggestion) {
        this.rejectSuggestion();
        return;
      }
    });

    // Ctrl+Space to trigger AI suggestion
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      this.triggerInlineSuggestion();
    });
  }

  /**
   * Setup content change listener for real-time suggestions
   */
  private setupContentChangeListener(): void {
    if (!this.editor) return;

    const disposable = this.editor.onDidChangeModelContent(() => {
      if (!this.isEnabled) return;

      // Clear existing timeout
      if (this.debounceTimeout) {
        window.clearTimeout(this.debounceTimeout);
      }

      // Debounce AI suggestions - more responsive like Cursor/Copilot
      this.debounceTimeout = window.setTimeout(() => {
        this.triggerInlineSuggestion();
      }, 500); // 500ms delay for more responsive suggestions
    });

    this.disposables.push(disposable);
  }

  /**
   * Provide inline completions
   */
  private async provideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    _context: monaco.languages.InlineCompletionContext
  ): Promise<monaco.languages.InlineCompletions | null> {
    if (!this.isEnabled || !this.editor) return null;

    try {
      const suggestion = await this.generateInlineSuggestion(model, position);
      if (!suggestion) return null;

      return {
        items: [{
          insertText: suggestion.text,
          range: suggestion.range,
          command: suggestion.command,
        }]
      };
    } catch (error) {
      console.warn('Inline AI completion failed:', error);
      return null;
    }
  }

  /**
   * Generate inline suggestion using AI - Enhanced Cursor/Copilot-style
   */
  private async generateInlineSuggestion(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<InlineSuggestion | null> {
    const content = model.getValue();
    const language = model.getLanguageId();
    
    // Get current line and context
    const currentLine = model.getLineContent(position.lineNumber);
    const beforeCursor = currentLine.substring(0, position.column - 1);
    const afterCursor = currentLine.substring(position.column - 1);

    // Enhanced context detection - look for patterns that suggest AI should help
    const shouldSuggest = this.shouldProvideSuggestion(beforeCursor, afterCursor, content, language);
    if (!shouldSuggest) return null;

    // Get enhanced context (20 lines before and after for better understanding)
    const startLine = Math.max(1, position.lineNumber - 20);
    const endLine = Math.min(model.getLineCount(), position.lineNumber + 10);
    const contextLines: string[] = [];
    
    for (let i = startLine; i <= endLine; i++) {
      contextLines.push(model.getLineContent(i));
    }

    const contextContent = contextLines.join('\n');

    // Analyze the context to determine suggestion type
    const suggestionType = this.analyzeSuggestionContext(beforeCursor, contextContent, language);

    try {
      let suggestion: string | null = null;

      switch (suggestionType) {
        case 'function_completion':
          suggestion = await this.generateFunctionCompletion(beforeCursor, contextContent, language);
          break;
        case 'import_statement':
          suggestion = await this.generateImportSuggestion(beforeCursor, contextContent, language);
          break;
        case 'variable_assignment':
          suggestion = await this.generateVariableCompletion(beforeCursor, contextContent, language);
          break;
        case 'comment_to_code':
          suggestion = await this.generateCodeFromComment(beforeCursor, contextContent, language);
          break;
        case 'error_fix':
          suggestion = await this.generateErrorFix(beforeCursor, contextContent, language);
          break;
        default:
          suggestion = await this.generateGenericCompletion(beforeCursor, contextContent, language);
      }

      if (!suggestion) return null;

      // Create suggestion range
      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      return {
        text: suggestion,
        range,
        command: {
          id: 'ai.acceptSuggestion',
          title: 'Accept AI Suggestion',
        },
      };
    } catch (error) {
      console.warn('Failed to generate inline suggestion:', error);
      return null;
    }
  }

  /**
   * Determine if AI should provide a suggestion based on context
   */
  private shouldProvideSuggestion(beforeCursor: string, afterCursor: string, _content: string, _language: string): boolean {
    // Don't suggest if cursor is in the middle of a word
    if (afterCursor.length > 0 && /\w/.test(afterCursor[0])) return false;

    // Don't suggest if line is empty or just whitespace
    if (!beforeCursor.trim()) return false;

    // Suggest for function definitions
    if (/function\s+\w*$|const\s+\w+\s*=\s*\(?$|=>\s*$/.test(beforeCursor)) return true;

    // Suggest for import statements
    if (/import\s+.*from\s*['"]?$|import\s*\{?$/.test(beforeCursor)) return true;

    // Suggest for variable assignments
    if (/const\s+\w+\s*=\s*$|let\s+\w+\s*=\s*$|var\s+\w+\s*=\s*$/.test(beforeCursor)) return true;

    // Suggest for comments that look like instructions
    if (/\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*[A-Z]/.test(beforeCursor)) return true;

    // Suggest for method calls
    if (/\.\w*$/.test(beforeCursor)) return true;

    // Suggest for control structures
    if (/if\s*\($|for\s*\($|while\s*\($|switch\s*\($/.test(beforeCursor)) return true;

    // Suggest for class definitions
    if (/class\s+\w*$|extends\s+\w*$/.test(beforeCursor)) return true;

    // Suggest if typing after certain keywords
    if (/\b(return|throw|await|yield)\s+$/.test(beforeCursor)) return true;

    return false;
  }

  /**
   * Analyze context to determine the type of suggestion needed
   */
  private analyzeSuggestionContext(beforeCursor: string, content: string, _language: string): string {
    if (/function\s+\w*$|const\s+\w+\s*=\s*\(?$|=>\s*$/.test(beforeCursor)) {
      return 'function_completion';
    }
    
    if (/import\s+.*from\s*['"]?$|import\s*\{?$/.test(beforeCursor)) {
      return 'import_statement';
    }
    
    if (/const\s+\w+\s*=\s*$|let\s+\w+\s*=\s*$|var\s+\w+\s*=\s*$/.test(beforeCursor)) {
      return 'variable_assignment';
    }
    
    if (/\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*[A-Z]/.test(beforeCursor)) {
      return 'comment_to_code';
    }
    
    // Check for common error patterns
    if (content.includes('undefined') || content.includes('null') || /error|Error/.test(content)) {
      return 'error_fix';
    }
    
    return 'generic';
  }

  /**
   * Generate function completion suggestions
   */
  private async generateFunctionCompletion(beforeCursor: string, context: string, language: string): Promise<string | null> {
    const prompt = `Complete this ${language} function based on the context:

Context:
${context}

Current line: ${beforeCursor}

Provide only the function body or completion, no explanations:`;

    try {
      return await aiAssistanceService.generateCode(prompt, language);
    } catch (error) {
      console.warn('Failed to generate function completion:', error);
      return null;
    }
  }

  /**
   * Generate import statement suggestions
   */
  private async generateImportSuggestion(beforeCursor: string, context: string, language: string): Promise<string | null> {
    const prompt = `Complete this ${language} import statement based on the context:

Context:
${context}

Current line: ${beforeCursor}

Suggest the most likely import completion:`;

    try {
      return await aiAssistanceService.generateCode(prompt, language);
    } catch (error) {
      console.warn('Failed to generate import suggestion:', error);
      return null;
    }
  }

  /**
   * Generate variable completion suggestions
   */
  private async generateVariableCompletion(beforeCursor: string, context: string, language: string): Promise<string | null> {
    const prompt = `Complete this ${language} variable assignment based on the context:

Context:
${context}

Current line: ${beforeCursor}

Provide the most appropriate value or expression:`;

    try {
      return await aiAssistanceService.generateCode(prompt, language);
    } catch (error) {
      console.warn('Failed to generate variable completion:', error);
      return null;
    }
  }

  /**
   * Generate code from comment instructions
   */
  private async generateCodeFromComment(beforeCursor: string, context: string, language: string): Promise<string | null> {
    const prompt = `Convert this comment to ${language} code:

Context:
${context}

Comment: ${beforeCursor}

Generate the code that implements what the comment describes:`;

    try {
      return await aiAssistanceService.generateCode(prompt, language);
    } catch (error) {
      console.warn('Failed to generate code from comment:', error);
      return null;
    }
  }

  /**
   * Generate error fix suggestions
   */
  private async generateErrorFix(beforeCursor: string, context: string, language: string): Promise<string | null> {
    const prompt = `Fix the error in this ${language} code:

Context:
${context}

Current line: ${beforeCursor}

Provide a fix for the most likely error:`;

    try {
      return await aiAssistanceService.generateCode(prompt, language);
    } catch (error) {
      console.warn('Failed to generate error fix:', error);
      return null;
    }
  }

  /**
   * Generate generic completion suggestions
   */
  private async generateGenericCompletion(beforeCursor: string, context: string, language: string): Promise<string | null> {
    const prompt = `Complete this ${language} code based on the context:

Context:
${context}

Current line: ${beforeCursor}

Provide the most likely completion:`;

    try {
      return await aiAssistanceService.generateCode(prompt, language);
    } catch (error) {
      console.warn('Failed to generate generic completion:', error);
      return null;
    }
  }

  /**
   * Trigger inline suggestion manually
   */
  private async triggerInlineSuggestion(): Promise<void> {
    if (!this.editor || !this.isEnabled) return;

    const model = this.editor.getModel();
    const position = this.editor.getPosition();
    
    if (!model || !position) return;

    try {
      const suggestion = await this.generateInlineSuggestion(model, position);
      if (suggestion) {
        this.showSuggestion(suggestion);
      }
    } catch (error) {
      console.warn('Failed to trigger inline suggestion:', error);
    }
  }

  /**
   * Show inline suggestion widget
   */
  private showSuggestion(suggestion: InlineSuggestion): void {
    if (!this.editor || !this.suggestionWidget) return;

    this.currentSuggestion = suggestion;
    
    // Update suggestion text
    const textElement = this.suggestionWidget.querySelector('.inline-suggestion-text');
    if (textElement) {
      textElement.textContent = suggestion.text;
    }

    // Position the widget
    const position = this.editor.getPosition();
    if (position) {
      const coords = this.editor.getScrolledVisiblePosition(position);
      if (coords) {
        this.suggestionWidget.style.display = 'block';
        this.suggestionWidget.style.left = `${coords.left}px`;
        this.suggestionWidget.style.top = `${coords.top + coords.height + 5}px`;
      }
    }

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (this.currentSuggestion === suggestion) {
        this.hideSuggestion();
      }
    }, 10000);
  }

  /**
   * Hide suggestion widget
   */
  private hideSuggestion(): void {
    if (this.suggestionWidget) {
      this.suggestionWidget.style.display = 'none';
    }
    this.currentSuggestion = null;
  }

  /**
   * Accept current suggestion
   */
  private acceptSuggestion(): void {
    if (!this.editor || !this.currentSuggestion) return;

    const position = this.editor.getPosition();
    if (!position) return;

    // Insert the suggestion text
    this.editor.executeEdits('ai-inline-suggestion', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
      text: this.currentSuggestion.text,
    }]);

    this.hideSuggestion();
  }

  /**
   * Reject current suggestion
   */
  private rejectSuggestion(): void {
    this.hideSuggestion();
  }

  /**
   * Enable or disable inline AI suggestions
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.hideSuggestion();
    }
  }

  /**
   * Check if inline AI is enabled
   */
  isInlineAIEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
    
    if (this.debounceTimeout) {
      window.clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (this.suggestionWidget) {
      this.suggestionWidget.remove();
      this.suggestionWidget = null;
    }

    this.currentSuggestion = null;
    this.editor = null;
  }
}

// Global instance
export const inlineAIProvider = new InlineAIProvider();