/**
 * AI Code Assistance Service
 * Extends existing Ollama service to support code completion and assistance
 */

import * as ollamaClient from '../modules/idea-generator/ollamaClient';
import { logger } from '../utils/errorLogger';

export interface CodeContext {
  content: string;
  language: string;
  position: {
    line: number;
    column: number;
  };
  filename?: string;
}

export interface CodeCompletion {
  text: string;
  kind: 'function' | 'variable' | 'class' | 'method' | 'property' | 'keyword' | 'snippet';
  detail?: string;
  documentation?: string;
  insertText: string;
  range?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface CodeExplanation {
  explanation: string;
  suggestions?: string[];
}

export interface RefactoringSuggestion {
  type: 'extract_method' | 'rename_variable' | 'simplify_logic' | 'optimize_performance' | 'improve_readability';
  title: string;
  description: string;
  originalCode: string;
  suggestedCode: string;
  confidence: number;
}

export interface ErrorFix {
  errorType: string;
  description: string;
  suggestedFix: string;
  explanation: string;
  confidence: number;
}

export interface DocumentationSuggestion {
  type: 'function' | 'class' | 'variable' | 'module';
  documentation: string;
  format: 'jsdoc' | 'docstring' | 'inline' | 'markdown';
}

export class AICodeAssistanceService {
  /**
   * Generate code completions based on context
   */
  async getCodeCompletions(context: CodeContext): Promise<CodeCompletion[]> {
    try {
      const isAvailable = await ollamaClient.isAvailable();
      if (!isAvailable) {
        throw new Error('Ollama service is not available');
      }

      const prompt = this.buildCompletionPrompt(context);
      const response = await ollamaClient.generate(prompt, {
        model: process.env.OLLAMA_MODEL || 'codellama',
        temperature: 0.3, // Lower temperature for more consistent code
        max_tokens: 500,
      });

      return this.parseCompletionResponse(response, context);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        context: {
          language: context.language,
          filename: context.filename,
        },
      });
      throw error;
    }
  }

  /**
   * Explain selected code
   */
  async explainCode(code: string, language: string): Promise<CodeExplanation> {
    try {
      const isAvailable = await ollamaClient.isAvailable();
      if (!isAvailable) {
        throw new Error('Ollama service is not available');
      }

      const prompt = this.buildExplanationPrompt(code, language);
      const response = await ollamaClient.generate(prompt, {
        model: process.env.OLLAMA_MODEL || 'codellama',
        temperature: 0.5,
        max_tokens: 800,
      });

      return this.parseExplanationResponse(response);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        language,
      });
      throw error;
    }
  }

  /**
   * Generate code from natural language description
   */
  async generateCode(description: string, language: string, context?: string): Promise<string> {
    try {
      const isAvailable = await ollamaClient.isAvailable();
      if (!isAvailable) {
        throw new Error('Ollama service is not available');
      }

      const prompt = this.buildCodeGenerationPrompt(description, language, context);
      const response = await ollamaClient.generate(prompt, {
        model: process.env.OLLAMA_MODEL || 'codellama',
        temperature: 0.4,
        max_tokens: 1000,
      });

      return this.parseCodeGenerationResponse(response);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        language,
        description,
      });
      throw error;
    }
  }

  /**
   * Build prompt for code completion - Enhanced Cursor/Copilot style
   */
  private buildCompletionPrompt(context: CodeContext): string {
    const { content, language, position } = context;
    const lines = content.split('\n');
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.column);
    const afterCursor = currentLine.substring(position.column);

    // Get more context for better suggestions (15 lines before and after)
    const startLine = Math.max(0, position.line - 15);
    const endLine = Math.min(lines.length - 1, position.line + 15);
    const contextLines = lines.slice(startLine, endLine + 1);

    // Detect patterns for smarter completions
    const isInFunction = content.includes('function') || content.includes('=>');
    const isInClass = content.includes('class ');
    const isInComment = beforeCursor.includes('//') || beforeCursor.includes('/*');
    const isAfterDot = beforeCursor.endsWith('.');
    const isAfterOpenParen = beforeCursor.endsWith('(');

    let contextHint = '';
    if (isInComment) {
      contextHint = 'The user is writing a comment. Suggest meaningful comment completions or code based on the comment.';
    } else if (isAfterDot) {
      contextHint = 'The user just typed a dot. Suggest relevant methods, properties, or chained operations.';
    } else if (isAfterOpenParen) {
      contextHint = 'The user just opened parentheses. Suggest function parameters or arguments.';
    } else if (isInFunction) {
      contextHint = 'The user is inside a function. Suggest relevant function body code, variables, or logic.';
    } else if (isInClass) {
      contextHint = 'The user is inside a class. Suggest methods, properties, or class-related code.';
    }

    return `You are an advanced AI code completion assistant like GitHub Copilot. Analyze the ${language} code and provide intelligent, contextually relevant completions.

Code Context:
\`\`\`${language}
${contextLines.join('\n')}
\`\`\`

Current line: "${currentLine}"
Before cursor: "${beforeCursor}"
After cursor: "${afterCursor}"
Position: line ${position.line + 1}, column ${position.column + 1}

${contextHint}

Provide 2-4 highly relevant completions that a professional developer would find useful. Focus on:
1. Completing the current statement intelligently
2. Suggesting common patterns for the current context
3. Providing helpful code snippets
4. Following ${language} best practices

Response format (JSON):
{
  "completions": [
    {
      "text": "what the user would see",
      "kind": "function|variable|class|method|property|keyword|snippet",
      "detail": "helpful description",
      "insertText": "actual code to insert",
      "documentation": "optional longer explanation"
    }
  ]
}

Make suggestions that feel natural and save the developer time.`;
  }

  /**
   * Build prompt for code explanation
   */
  private buildExplanationPrompt(code: string, language: string): string {
    return `You are a code explanation assistant. Explain the following ${language} code in clear, concise terms.

Code to explain:
\`\`\`${language}
${code}
\`\`\`

Provide:
1. A clear explanation of what this code does
2. Any notable patterns, algorithms, or techniques used
3. Potential improvements or suggestions (if any)

Format your response as JSON:
{
  "explanation": "detailed explanation of the code",
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Keep explanations practical and focused on helping developers understand the code.`;
  }

  /**
   * Build prompt for code generation
   */
  private buildCodeGenerationPrompt(description: string, language: string, context?: string): string {
    const contextSection = context ? `\n\nExisting context:\n\`\`\`${language}\n${context}\n\`\`\`` : '';

    return `You are a code generation assistant. Generate ${language} code based on the following description.

Description: ${description}${contextSection}

Requirements:
1. Generate clean, readable, and well-commented code
2. Follow ${language} best practices and conventions
3. Include error handling where appropriate
4. Make the code production-ready

Respond with only the generated code, no additional explanation:`;
  }

  /**
   * Parse completion response from Ollama
   */
  private parseCompletionResponse(response: string, _context: CodeContext): CodeCompletion[] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      if (parsed.completions && Array.isArray(parsed.completions)) {
        return parsed.completions.map((comp: any) => ({
          text: comp.text || '',
          kind: comp.kind || 'snippet',
          detail: comp.detail || '',
          documentation: comp.documentation,
          insertText: comp.insertText || comp.text || '',
          range: comp.range,
        }));
      }
    } catch {
      // If JSON parsing fails, create a simple completion from the response
      logger.logWarning('Failed to parse completion response as JSON, using fallback');
    }

    // Fallback: create a single completion from the response
    const cleanResponse = response.trim();
    if (cleanResponse) {
      return [{
        text: cleanResponse,
        kind: 'snippet',
        detail: 'AI-generated completion',
        insertText: cleanResponse,
      }];
    }

    return [];
  }

  /**
   * Parse explanation response from Ollama
   */
  private parseExplanationResponse(response: string): CodeExplanation {
    try {
      const parsed = JSON.parse(response);
      return {
        explanation: parsed.explanation || response,
        suggestions: parsed.suggestions || [],
      };
    } catch {
      // If JSON parsing fails, use the raw response as explanation
      return {
        explanation: response.trim(),
        suggestions: [],
      };
    }
  }

  /**
   * Build prompt for refactoring suggestions
   */
  private buildRefactoringPrompt(code: string, language: string): string {
    return `You are a code refactoring assistant. Analyze the following ${language} code and suggest improvements.

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Provide refactoring suggestions focusing on:
1. Code readability and maintainability
2. Performance optimizations
3. Best practices and patterns
4. Simplification opportunities

Format your response as JSON:
{
  "suggestions": [
    {
      "type": "extract_method|rename_variable|simplify_logic|optimize_performance|improve_readability",
      "title": "Brief title of the suggestion",
      "description": "Detailed description of the improvement",
      "originalCode": "code snippet to be changed",
      "suggestedCode": "improved code snippet",
      "confidence": 0.8
    }
  ]
}

Provide 1-3 most impactful suggestions with confidence scores (0.0-1.0).`;
  }

  /**
   * Build prompt for comment-to-code generation
   */
  private buildCommentToCodePrompt(comments: string, language: string, context?: string): string {
    const contextSection = context ? `\n\nExisting context:\n\`\`\`${language}\n${context}\n\`\`\`` : '';

    return `You are a code generation assistant. Generate ${language} code based on the following comments/description.

Comments/Description:
${comments}${contextSection}

Requirements:
1. Generate clean, readable, and well-structured code
2. Follow ${language} best practices and conventions
3. Include appropriate error handling
4. Add inline comments for complex logic
5. Make the code production-ready

Respond with only the generated code, no additional explanation:`;
  }

  /**
   * Build prompt for error fix suggestions
   */
  private buildErrorFixPrompt(errorMessage: string, code: string, language: string): string {
    return `You are a debugging assistant. Analyze the following ${language} error and suggest fixes.

Error message:
${errorMessage}

Code with error:
\`\`\`${language}
${code}
\`\`\`

Provide fix suggestions that address the error. Format your response as JSON:
{
  "fixes": [
    {
      "errorType": "syntax|runtime|logic|type",
      "description": "Description of what's causing the error",
      "suggestedFix": "corrected code snippet",
      "explanation": "explanation of why this fix works",
      "confidence": 0.9
    }
  ]
}

Focus on the most likely causes and provide practical, working solutions.`;
  }

  /**
   * Build prompt for documentation generation
   */
  private buildDocumentationPrompt(code: string, language: string): string {
    return `You are a documentation assistant. Generate appropriate documentation for the following ${language} code.

Code to document:
\`\`\`${language}
${code}
\`\`\`

Generate documentation that includes:
1. Purpose and functionality description
2. Parameters and return values (if applicable)
3. Usage examples (if helpful)
4. Any important notes or warnings

Format your response as JSON:
{
  "type": "function|class|variable|module",
  "documentation": "formatted documentation string",
  "format": "jsdoc|docstring|inline|markdown"
}

Use the appropriate documentation format for the ${language} language.`;
  }

  /**
   * Parse code generation response from Ollama
   */
  private parseCodeGenerationResponse(response: string): string {
    // Remove markdown code blocks if present
    const codeBlockRegex = /```[\w]*\n?([\s\S]*?)\n?```/;
    const match = response.match(codeBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }

    return response.trim();
  }

  /**
   * Parse refactoring response from Ollama
   */
  private parseRefactoringResponse(response: string, originalCode: string): RefactoringSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return parsed.suggestions.map((suggestion: any) => ({
          type: suggestion.type || 'improve_readability',
          title: suggestion.title || 'Code improvement',
          description: suggestion.description || '',
          originalCode: suggestion.originalCode || originalCode,
          suggestedCode: suggestion.suggestedCode || '',
          confidence: Math.min(Math.max(suggestion.confidence || 0.5, 0), 1),
        }));
      }
    } catch {
      logger.logWarning('Failed to parse refactoring response as JSON, using fallback');
    }

    // Fallback: create a generic suggestion
    return [{
      type: 'improve_readability',
      title: 'AI Suggestion',
      description: response.trim(),
      originalCode,
      suggestedCode: response.trim(),
      confidence: 0.5,
    }];
  }

  /**
   * Parse error fix response from Ollama
   */
  private parseErrorFixResponse(response: string): ErrorFix[] {
    try {
      const parsed = JSON.parse(response);
      if (parsed.fixes && Array.isArray(parsed.fixes)) {
        return parsed.fixes.map((fix: any) => ({
          errorType: fix.errorType || 'unknown',
          description: fix.description || '',
          suggestedFix: fix.suggestedFix || '',
          explanation: fix.explanation || '',
          confidence: Math.min(Math.max(fix.confidence || 0.5, 0), 1),
        }));
      }
    } catch {
      logger.logWarning('Failed to parse error fix response as JSON, using fallback');
    }

    // Fallback: create a generic fix suggestion
    return [{
      errorType: 'unknown',
      description: 'AI-suggested fix',
      suggestedFix: response.trim(),
      explanation: 'Generated fix based on error analysis',
      confidence: 0.5,
    }];
  }

  /**
   * Parse documentation response from Ollama
   */
  private parseDocumentationResponse(response: string, language: string): DocumentationSuggestion {
    try {
      const parsed = JSON.parse(response);
      return {
        type: parsed.type || 'function',
        documentation: parsed.documentation || response.trim(),
        format: parsed.format || this.getDefaultDocFormat(language),
      };
    } catch {
      // Fallback: use raw response as documentation
      return {
        type: 'function',
        documentation: response.trim(),
        format: this.getDefaultDocFormat(language),
      };
    }
  }

  /**
   * Get default documentation format for language
   */
  private getDefaultDocFormat(language: string): DocumentationSuggestion['format'] {
    const formatMap: Record<string, DocumentationSuggestion['format']> = {
      javascript: 'jsdoc',
      typescript: 'jsdoc',
      python: 'docstring',
      java: 'jsdoc',
      cpp: 'inline',
      c: 'inline',
      csharp: 'inline',
      go: 'inline',
      rust: 'inline',
      php: 'inline',
      ruby: 'inline',
    };

    return formatMap[language] || 'inline';
  }

  /**
   * Generate refactoring suggestions for code
   */
  async getRefactoringSuggestions(code: string, language: string): Promise<RefactoringSuggestion[]> {
    try {
      const isAvailable = await ollamaClient.isAvailable();
      if (!isAvailable) {
        throw new Error('Ollama service is not available');
      }

      const prompt = this.buildRefactoringPrompt(code, language);
      const response = await ollamaClient.generate(prompt, {
        model: process.env.OLLAMA_MODEL || 'codellama',
        temperature: 0.4,
        max_tokens: 1200,
      });

      return this.parseRefactoringResponse(response, code);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        language,
      });
      throw error;
    }
  }

  /**
   * Generate code from comments
   */
  async generateCodeFromComments(comments: string, language: string, context?: string): Promise<string> {
    try {
      const isAvailable = await ollamaClient.isAvailable();
      if (!isAvailable) {
        throw new Error('Ollama service is not available');
      }

      const prompt = this.buildCommentToCodePrompt(comments, language, context);
      const response = await ollamaClient.generate(prompt, {
        model: process.env.OLLAMA_MODEL || 'llama3',
        temperature: 0.3,
        max_tokens: 1000,
      });

      return this.parseCodeGenerationResponse(response);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        language,
        comments,
      });
      throw error;
    }
  }

  /**
   * Suggest fixes for errors
   */
  async suggestErrorFixes(errorMessage: string, code: string, language: string): Promise<ErrorFix[]> {
    try {
      const isAvailable = await ollamaClient.isAvailable();
      if (!isAvailable) {
        throw new Error('Ollama service is not available');
      }

      const prompt = this.buildErrorFixPrompt(errorMessage, code, language);
      const response = await ollamaClient.generate(prompt, {
        model: process.env.OLLAMA_MODEL || 'llama3',
        temperature: 0.3,
        max_tokens: 1000,
      });

      return this.parseErrorFixResponse(response);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        language,
        errorMessage,
      });
      throw error;
    }
  }

  /**
   * Generate documentation for code
   */
  async generateDocumentation(code: string, language: string): Promise<DocumentationSuggestion> {
    try {
      const isAvailable = await ollamaClient.isAvailable();
      if (!isAvailable) {
        throw new Error('Ollama service is not available');
      }

      const prompt = this.buildDocumentationPrompt(code, language);
      const response = await ollamaClient.generate(prompt, {
        model: process.env.OLLAMA_MODEL || 'llama3',
        temperature: 0.4,
        max_tokens: 800,
      });

      return this.parseDocumentationResponse(response, language);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        language,
      });
      throw error;
    }
  }

  /**
   * Check if AI assistance is available
   */
  async isAvailable(): Promise<boolean> {
    return await ollamaClient.isAvailable();
  }
}

export const aiCodeAssistanceService = new AICodeAssistanceService();