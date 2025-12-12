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
        model: process.env.OLLAMA_MODEL || 'llama3',
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
        model: process.env.OLLAMA_MODEL || 'llama3',
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
        model: process.env.OLLAMA_MODEL || 'llama3',
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
   * Build prompt for code completion
   */
  private buildCompletionPrompt(context: CodeContext): string {
    const { content, language, position } = context;
    const lines = content.split('\n');
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.column);
    const afterCursor = currentLine.substring(position.column);

    // Get surrounding context (5 lines before and after)
    const startLine = Math.max(0, position.line - 5);
    const endLine = Math.min(lines.length - 1, position.line + 5);
    const contextLines = lines.slice(startLine, endLine + 1);

    return `You are a code completion assistant. Given the following ${language} code context, suggest appropriate completions for the cursor position.

Context:
\`\`\`${language}
${contextLines.join('\n')}
\`\`\`

Current line: "${currentLine}"
Before cursor: "${beforeCursor}"
After cursor: "${afterCursor}"
Cursor position: line ${position.line + 1}, column ${position.column + 1}

Provide 1-3 relevant code completions. For each completion, specify:
1. The completion text
2. The type (function, variable, class, method, property, keyword, snippet)
3. A brief description

Format your response as JSON:
{
  "completions": [
    {
      "text": "completion text",
      "kind": "function|variable|class|method|property|keyword|snippet",
      "detail": "brief description",
      "insertText": "text to insert"
    }
  ]
}

Focus on contextually relevant suggestions based on the surrounding code.`;
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
   * Check if AI assistance is available
   */
  async isAvailable(): Promise<boolean> {
    return await ollamaClient.isAvailable();
  }
}

export const aiCodeAssistanceService = new AICodeAssistanceService();