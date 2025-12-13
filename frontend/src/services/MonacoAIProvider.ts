/**
 * Monaco Editor AI Completion Provider
 * Integrates AI assistance with Monaco Editor
 */

import * as monaco from 'monaco-editor';
import { 
  aiAssistanceService, 
  CodeContext, 
  CodeCompletion
} from './ai-assistance.service';

export class MonacoAIProvider {
  private disposables: monaco.IDisposable[] = [];
  private isEnabled: boolean = true;
  private debounceTimeout: number | null = null;

  /**
   * Register AI completion provider and enhanced features for all languages
   */
  registerCompletionProvider(): void {
    // Register for common programming languages
    const languages = [
      'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
      'go', 'rust', 'php', 'ruby', 'html', 'css', 'json', 'yaml', 'sql'
    ];

    languages.forEach(language => {
      const disposable = monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: this.provideCompletionItems.bind(this),
        triggerCharacters: ['.', '(', '[', '{', ' ', '\n'],
      });
      this.disposables.push(disposable);
    });

    // Register enhanced AI features
    this.registerAICommands();
    this.registerContextMenuActions();
  }

  /**
   * Register AI-powered commands
   */
  private registerAICommands(): void {
    // Note: Monaco editor actions need to be registered per editor instance
    // This is a placeholder for the enhanced AI features
    // In a real implementation, these would be registered when an editor is created
    console.log('AI commands registered (placeholder)');
  }

  /**
   * Register context menu actions
   */
  private registerContextMenuActions(): void {
    // Context menu actions are registered via the editor actions above
    // They will appear in the context menu under the 'ai-assistance' group
  }

  /**
   * Provide completion items using AI - Enhanced for Cursor/Copilot-style experience
   */
  private async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext
  ): Promise<monaco.languages.CompletionList | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      // Show loading indicator
      this.showAILoadingIndicator(model, position);

      // Debounce requests to avoid too many API calls
      if (this.debounceTimeout) {
        window.clearTimeout(this.debounceTimeout);
      }

      return new Promise((resolve) => {
        this.debounceTimeout = window.setTimeout(async () => {
          try {
            const completions = await this.getAICompletions(model, position, context);
            this.hideAILoadingIndicator();
            resolve({
              suggestions: completions,
              incomplete: false,
            });
          } catch (error) {
            console.warn('AI completion failed:', error);
            this.hideAILoadingIndicator();
            resolve(null);
          }
        }, 200); // Faster response for better UX
      });
    } catch (error) {
      console.warn('AI completion error:', error);
      this.hideAILoadingIndicator();
      return null;
    }
  }

  /**
   * Get AI completions for the current context - Enhanced for better suggestions
   */
  private async getAICompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context?: monaco.languages.CompletionContext
  ): Promise<monaco.languages.CompletionItem[]> {
    const content = model.getValue();
    const language = model.getLanguageId();
    
    // Get current line and cursor position
    const wordInfo = model.getWordUntilPosition(position);
    const currentLine = model.getLineContent(position.lineNumber);
    const beforeCursor = currentLine.substring(0, position.column - 1);
    // const afterCursor = currentLine.substring(position.column - 1);
    
    // Enhanced context detection - trigger AI for more scenarios
    const shouldTriggerAI = 
      context?.triggerKind === monaco.languages.CompletionTriggerKind.TriggerCharacter ||
      beforeCursor.trim().length > 2 ||
      beforeCursor.includes('//') ||
      beforeCursor.includes('/*') ||
      beforeCursor.includes('function') ||
      beforeCursor.includes('const') ||
      beforeCursor.includes('let') ||
      beforeCursor.includes('var') ||
      beforeCursor.includes('class') ||
      beforeCursor.includes('interface') ||
      beforeCursor.includes('type');

    if (!shouldTriggerAI && wordInfo.word.length > 0 && position.column > wordInfo.startColumn + 1) {
      return [];
    }

    const codeContext: CodeContext = {
      content,
      language,
      position: {
        line: position.lineNumber - 1, // Monaco uses 1-based, our API uses 0-based
        column: position.column - 1,
      },
      filename: model.uri.path,
    };

    try {
      const aiCompletions = await aiAssistanceService.getCodeCompletions(codeContext);
      return this.convertToMonacoCompletions(aiCompletions, position, wordInfo);
    } catch (error) {
      console.warn('Failed to get AI completions:', error);
      return [];
    }
  }

  /**
   * Convert AI completions to Monaco completion items
   */
  private convertToMonacoCompletions(
    aiCompletions: CodeCompletion[],
    position: monaco.Position,
    wordInfo: monaco.editor.IWordAtPosition
  ): monaco.languages.CompletionItem[] {
    return aiCompletions.map((completion, index) => {
      const kind = this.getMonacoCompletionKind(completion.kind);
      
      return {
        label: completion.text,
        kind,
        detail: completion.detail || 'AI suggestion',
        documentation: completion.documentation || completion.detail,
        insertText: completion.insertText,
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordInfo.startColumn,
          endColumn: position.column,
        },
        sortText: `ai_${index.toString().padStart(3, '0')}`, // Sort AI suggestions after built-in ones
        filterText: completion.text,
        preselect: index === 0, // Preselect the first AI suggestion
        // tags: [monaco.languages.CompletionItemTag.AI], // Mark as AI-generated (if supported)
      };
    });
  }

  /**
   * Convert AI completion kind to Monaco completion kind
   */
  private getMonacoCompletionKind(kind: CodeCompletion['kind']): monaco.languages.CompletionItemKind {
    const kindMap: Record<CodeCompletion['kind'], monaco.languages.CompletionItemKind> = {
      function: monaco.languages.CompletionItemKind.Function,
      variable: monaco.languages.CompletionItemKind.Variable,
      class: monaco.languages.CompletionItemKind.Class,
      method: monaco.languages.CompletionItemKind.Method,
      property: monaco.languages.CompletionItemKind.Property,
      keyword: monaco.languages.CompletionItemKind.Keyword,
      snippet: monaco.languages.CompletionItemKind.Snippet,
    };

    return kindMap[kind] || monaco.languages.CompletionItemKind.Text;
  }

  /**
   * Enable or disable AI completions
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if AI completions are enabled
   */
  isAIEnabled(): boolean {
    return this.isEnabled;
  }



  /**
   * Show AI loading indicator
   */
  private showAILoadingIndicator(model: monaco.editor.ITextModel, position: monaco.Position): void {
    // Add a subtle loading indicator in the editor
    const decorations = [{
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      options: {
        afterContentClassName: 'ai-loading-decoration',
        hoverMessage: { value: 'AI is generating suggestions...' },
      }
    }];
    
    model.deltaDecorations([], decorations);
  }

  /**
   * Hide AI loading indicator
   */
  private hideAILoadingIndicator(): void {
    // Loading indicator will be automatically removed when decorations are updated
  }

  /**
   * Dispose all registered providers
   */
  dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
    
    if (this.debounceTimeout) {
      window.clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }
}

// Global instance
export const monacoAIProvider = new MonacoAIProvider();