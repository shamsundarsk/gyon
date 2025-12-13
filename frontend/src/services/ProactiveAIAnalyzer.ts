/**
 * Proactive AI Analyzer - Background analysis for smart suggestions
 * Continuously analyzes code for potential improvements and suggestions
 */

import { aiAssistanceService } from './ai-assistance.service';

export interface CodeIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion' | 'optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fix?: {
    description: string;
    code: string;
    confidence: number;
  };
}

export interface SmartSuggestion {
  id: string;
  type: 'refactor' | 'optimize' | 'security' | 'best_practice' | 'documentation';
  priority: number;
  title: string;
  description: string;
  code?: string;
  confidence: number;
  estimatedImpact: 'low' | 'medium' | 'high';
}

export class ProactiveAIAnalyzer {
  private analysisTimeout: number | null = null;
  private isAnalyzing = false;
  private lastAnalyzedContent = '';
  private listeners: Array<(issues: CodeIssue[], suggestions: SmartSuggestion[]) => void> = [];

  /**
   * Start analyzing code content
   */
  analyzeCode(content: string, language: string, filename?: string): void {
    // Skip if content hasn't changed significantly
    if (this.lastAnalyzedContent === content || this.isAnalyzing) {
      return;
    }

    // Clear existing timeout
    if (this.analysisTimeout) {
      window.clearTimeout(this.analysisTimeout);
    }

    // Debounce analysis
    this.analysisTimeout = window.setTimeout(async () => {
      await this.performAnalysis(content, language, filename);
    }, 2000); // 2 second delay for background analysis
  }

  /**
   * Perform comprehensive code analysis
   */
  private async performAnalysis(content: string, language: string, filename?: string): Promise<void> {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.lastAnalyzedContent = content;

    try {
      const [issues, suggestions] = await Promise.all([
        this.analyzeCodeIssues(content, language),
        this.generateSmartSuggestions(content, language, filename)
      ]);

      // Notify listeners
      this.listeners.forEach(listener => {
        try {
          listener(issues, suggestions);
        } catch (error) {
          console.warn('Error in analysis listener:', error);
        }
      });
    } catch (error) {
      console.warn('Code analysis failed:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Analyze code for issues and potential problems
   */
  private async analyzeCodeIssues(content: string, language: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // Static analysis for common issues
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Security issues
      if (trimmedLine.includes('eval(')) {
        issues.push({
          id: `security-eval-${lineNumber}`,
          type: 'error',
          severity: 'critical',
          title: 'Security Risk: eval() usage',
          description: 'Using eval() can lead to code injection vulnerabilities',
          line: lineNumber,
          column: line.indexOf('eval(') + 1,
          fix: {
            description: 'Replace eval() with safer alternatives like JSON.parse() or Function constructor',
            code: '// Consider using JSON.parse() for JSON data or Function constructor for dynamic code',
            confidence: 0.8
          }
        });
      }

      if (trimmedLine.includes('innerHTML =') && !trimmedLine.includes('textContent')) {
        issues.push({
          id: `security-innerHTML-${lineNumber}`,
          type: 'warning',
          severity: 'high',
          title: 'Security Risk: innerHTML usage',
          description: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
          line: lineNumber,
          column: line.indexOf('innerHTML') + 1,
          fix: {
            description: 'Use textContent for text or sanitize HTML content',
            code: 'element.textContent = text; // or use a sanitization library',
            confidence: 0.9
          }
        });
      }

      // Performance issues
      if (language === 'javascript' || language === 'typescript') {
        if (trimmedLine.includes('document.getElementById') && content.includes('document.getElementById')) {
          const count = (content.match(/document\.getElementById/g) || []).length;
          if (count > 3) {
            issues.push({
              id: `performance-dom-${lineNumber}`,
              type: 'suggestion',
              severity: 'medium',
              title: 'Performance: Repeated DOM queries',
              description: 'Multiple getElementById calls can be optimized by caching references',
              line: lineNumber,
              column: line.indexOf('document.getElementById') + 1,
              fix: {
                description: 'Cache DOM references in variables',
                code: 'const element = document.getElementById("id"); // Cache and reuse',
                confidence: 0.7
              }
            });
          }
        }

        // Console.log in production
        if (trimmedLine.includes('console.log')) {
          issues.push({
            id: `cleanup-console-${lineNumber}`,
            type: 'suggestion',
            severity: 'low',
            title: 'Cleanup: Debug statement',
            description: 'Console.log statements should be removed before production',
            line: lineNumber,
            column: line.indexOf('console.log') + 1,
            fix: {
              description: 'Remove console.log statement',
              code: '// Remove this line or use a proper logging library',
              confidence: 0.95
            }
          });
        }

        // Missing error handling
        if (trimmedLine.includes('await ') && !content.includes('try') && !content.includes('catch')) {
          issues.push({
            id: `error-handling-${lineNumber}`,
            type: 'warning',
            severity: 'medium',
            title: 'Missing Error Handling',
            description: 'Async operations should have proper error handling',
            line: lineNumber,
            column: line.indexOf('await') + 1,
            fix: {
              description: 'Wrap async operations in try-catch blocks',
              code: 'try {\n  const result = await operation();\n} catch (error) {\n  console.error("Error:", error);\n}',
              confidence: 0.8
            }
          });
        }

        // Var usage
        if (trimmedLine.startsWith('var ')) {
          issues.push({
            id: `modernize-var-${lineNumber}`,
            type: 'suggestion',
            severity: 'low',
            title: 'Modernize: Use const/let',
            description: 'var has function scope, consider using const or let for block scope',
            line: lineNumber,
            column: 1,
            fix: {
              description: 'Replace var with const or let',
              code: line.replace('var ', 'const '), // Simple replacement
              confidence: 0.9
            }
          });
        }
      }

      // Python-specific issues
      if (language === 'python') {
        if (trimmedLine.includes('print(') && !trimmedLine.includes('# debug')) {
          issues.push({
            id: `cleanup-print-${lineNumber}`,
            type: 'suggestion',
            severity: 'low',
            title: 'Cleanup: Debug print statement',
            description: 'Print statements should be removed or replaced with proper logging',
            line: lineNumber,
            column: line.indexOf('print(') + 1,
            fix: {
              description: 'Use logging instead of print',
              code: 'import logging\nlogging.info("message")',
              confidence: 0.8
            }
          });
        }

        if (trimmedLine.includes('except:') && !trimmedLine.includes('except Exception:')) {
          issues.push({
            id: `exception-handling-${lineNumber}`,
            type: 'warning',
            severity: 'medium',
            title: 'Broad Exception Handling',
            description: 'Catching all exceptions can hide important errors',
            line: lineNumber,
            column: line.indexOf('except:') + 1,
            fix: {
              description: 'Specify exception types',
              code: 'except ValueError as e:  # Be specific about exception types',
              confidence: 0.7
            }
          });
        }
      }
    });

    return issues;
  }

  /**
   * Generate smart suggestions for code improvement
   */
  private async generateSmartSuggestions(content: string, language: string, _filename?: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    try {
      // Check if AI service is available
      // Check if AI service is available (simplified for now)
      const isAvailable = true;
      if (!isAvailable) {
        return this.getStaticSuggestions(content, language);
      }

      // Get AI-powered refactoring suggestions
      const refactoringSuggestions = await aiAssistanceService.getRefactoringSuggestions(content, language);
      
      refactoringSuggestions.forEach((suggestion, index) => {
        suggestions.push({
          id: `ai-refactor-${index}`,
          type: 'refactor',
          priority: Math.round(suggestion.confidence * 10),
          title: suggestion.title,
          description: suggestion.description,
          code: suggestion.suggestedCode,
          confidence: suggestion.confidence,
          estimatedImpact: suggestion.confidence > 0.8 ? 'high' : suggestion.confidence > 0.6 ? 'medium' : 'low'
        });
      });
    } catch (error) {
      console.warn('AI suggestions failed, using static analysis:', error);
      return this.getStaticSuggestions(content, language);
    }

    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  }

  /**
   * Get static suggestions when AI is not available
   */
  private getStaticSuggestions(content: string, language: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Documentation suggestions
    if ((language === 'javascript' || language === 'typescript') && 
        content.includes('function') && !content.includes('/**')) {
      suggestions.push({
        id: 'add-jsdoc',
        type: 'documentation',
        priority: 6,
        title: 'Add JSDoc Documentation',
        description: 'Functions should have JSDoc comments for better maintainability',
        confidence: 0.8,
        estimatedImpact: 'medium'
      });
    }

    // Security suggestions
    if (content.includes('http://') && !content.includes('localhost')) {
      suggestions.push({
        id: 'use-https',
        type: 'security',
        priority: 8,
        title: 'Use HTTPS URLs',
        description: 'HTTP URLs should be replaced with HTTPS for security',
        confidence: 0.9,
        estimatedImpact: 'high'
      });
    }

    // Performance suggestions
    if (language === 'javascript' && content.includes('for (') && content.includes('.length')) {
      suggestions.push({
        id: 'cache-length',
        type: 'optimize',
        priority: 5,
        title: 'Cache Array Length',
        description: 'Cache array length in loops for better performance',
        confidence: 0.7,
        estimatedImpact: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Add listener for analysis results
   */
  addListener(listener: (issues: CodeIssue[], suggestions: SmartSuggestion[]) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener: (issues: CodeIssue[], suggestions: SmartSuggestion[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Clear all analysis data
   */
  clear(): void {
    if (this.analysisTimeout) {
      window.clearTimeout(this.analysisTimeout);
      this.analysisTimeout = null;
    }
    this.lastAnalyzedContent = '';
    this.isAnalyzing = false;
  }

  /**
   * Dispose analyzer
   */
  dispose(): void {
    this.clear();
    this.listeners = [];
  }
}

// Global instance
export const proactiveAIAnalyzer = new ProactiveAIAnalyzer();