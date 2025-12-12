/**
 * AI Code Assistance Service
 * Frontend service for AI-powered code assistance features
 */

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

export interface AIAssistanceStatus {
  available: boolean;
  service: string;
  model: string;
  url: string;
}

class AIAssistanceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Get code completions for the given context
   */
  async getCodeCompletions(context: CodeContext): Promise<CodeCompletion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-assistance/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get code completions');
      }

      return result.data.completions || [];
    } catch (error) {
      console.error('Error getting code completions:', error);
      throw error;
    }
  }

  /**
   * Explain the given code
   */
  async explainCode(code: string, language: string): Promise<CodeExplanation> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-assistance/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to explain code');
      }

      return result.data.explanation;
    } catch (error) {
      console.error('Error explaining code:', error);
      throw error;
    }
  }

  /**
   * Generate code from natural language description
   */
  async generateCode(description: string, language: string, context?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-assistance/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, language, context }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate code');
      }

      return result.data.code;
    } catch (error) {
      console.error('Error generating code:', error);
      throw error;
    }
  }

  /**
   * Check AI assistance availability
   */
  async getStatus(): Promise<AIAssistanceStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-assistance/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get AI assistance status');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting AI assistance status:', error);
      // Return default unavailable status on error
      return {
        available: false,
        service: 'ollama',
        model: 'unknown',
        url: 'unknown',
      };
    }
  }
}

export const aiAssistanceService = new AIAssistanceService();