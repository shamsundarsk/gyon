/**
 * Property-Based Tests for Advanced AI Features
 * **Feature: ai-code-editor, Property: AI-generated code is syntactically valid**
 * **Validates: Requirements 3.4, 3.5**
 */

import * as fc from 'fast-check';
import { aiCodeAssistanceService } from '../services/AICodeAssistanceService';
import * as ollamaClient from '../modules/idea-generator/ollamaClient';

// Mock the ollama client for testing
jest.mock('../modules/idea-generator/ollamaClient');
const mockedOllamaClient = ollamaClient as jest.Mocked<typeof ollamaClient>;

describe('Advanced AI Features Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property: AI-generated code is syntactically valid', () => {
    /**
     * Property Test: Refactoring suggestions should produce syntactically valid code
     * For any valid code input, refactoring suggestions should:
     * 1. Contain valid syntax for the target language
     * 2. Have proper structure (not empty or malformed)
     * 3. Include meaningful improvement descriptions
     */
    it('should generate syntactically valid refactoring suggestions for any code', async () => {
      mockedOllamaClient.isAvailable.mockResolvedValue(true);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            code: fc.string({ minLength: 10, maxLength: 300 }),
            language: fc.constantFrom('javascript', 'typescript', 'python', 'java', 'cpp')
          }),
          async ({ code, language }) => {
            // Mock a valid refactoring response
            const mockResponse = JSON.stringify({
              suggestions: [
                {
                  type: 'improve_readability',
                  title: 'Improve variable naming',
                  description: 'Use more descriptive variable names',
                  originalCode: code.substring(0, 50),
                  suggestedCode: generateValidCodeForLanguage(language, 'improved'),
                  confidence: 0.8
                }
              ]
            });
            
            mockedOllamaClient.generate.mockResolvedValue(mockResponse);

            const suggestions = await aiCodeAssistanceService.getRefactoringSuggestions(code, language);

            // Property 1: Should return valid suggestions array
            expect(suggestions).toBeDefined();
            expect(Array.isArray(suggestions)).toBe(true);

            if (suggestions.length > 0) {
              suggestions.forEach(suggestion => {
                // Property 2: Each suggestion should have required fields
                expect(suggestion.type).toBeDefined();
                expect(['extract_method', 'rename_variable', 'simplify_logic', 'optimize_performance', 'improve_readability'])
                  .toContain(suggestion.type);
                
                expect(suggestion.title).toBeDefined();
                expect(typeof suggestion.title).toBe('string');
                expect(suggestion.title.length).toBeGreaterThan(0);
                
                expect(suggestion.description).toBeDefined();
                expect(typeof suggestion.description).toBe('string');
                
                expect(suggestion.suggestedCode).toBeDefined();
                expect(typeof suggestion.suggestedCode).toBe('string');
                expect(suggestion.suggestedCode.trim().length).toBeGreaterThan(0);
                
                // Property 3: Confidence should be between 0 and 1
                expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
                expect(suggestion.confidence).toBeLessThanOrEqual(1);
                
                // Property 4: Suggested code should be syntactically plausible for the language
                validateCodeSyntaxForLanguage(suggestion.suggestedCode, language);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    /**
     * Property Test: Code generation from comments should produce valid code
     * For any comment/description, generated code should:
     * 1. Be syntactically valid for the target language
     * 2. Not be empty or trivial
     * 3. Follow language conventions
     */
    it('should generate syntactically valid code from any comments', async () => {
      mockedOllamaClient.isAvailable.mockResolvedValue(true);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            comments: fc.string({ minLength: 5, maxLength: 200 }),
            language: fc.constantFrom('javascript', 'typescript', 'python', 'java'),
            context: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined })
          }),
          async ({ comments, language, context }) => {
            // Mock generated code based on language
            const mockCode = generateValidCodeForLanguage(language, 'generated');
            mockedOllamaClient.generate.mockResolvedValue(mockCode);

            const generatedCode = await aiCodeAssistanceService.generateCodeFromComments(comments, language, context);

            // Property 1: Generated code should not be empty
            expect(generatedCode).toBeDefined();
            expect(typeof generatedCode).toBe('string');
            expect(generatedCode.trim().length).toBeGreaterThan(0);
            
            // Property 2: Code should be syntactically plausible for the language
            validateCodeSyntaxForLanguage(generatedCode, language);
            
            // Property 3: Generated code should be reasonably sized (not just whitespace)
            expect(generatedCode.replace(/\s/g, '').length).toBeGreaterThan(3);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    /**
     * Property Test: Error fix suggestions should produce valid fixes
     * For any error message and code, fixes should:
     * 1. Be syntactically valid
     * 2. Have meaningful descriptions
     * 3. Include proper error type classification
     */
    it('should generate syntactically valid error fixes for any error', async () => {
      mockedOllamaClient.isAvailable.mockResolvedValue(true);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            errorMessage: fc.string({ minLength: 5, maxLength: 100 }),
            code: fc.string({ minLength: 5, maxLength: 200 }),
            language: fc.constantFrom('javascript', 'typescript', 'python', 'java')
          }),
          async ({ errorMessage, code, language }) => {
            // Mock a valid error fix response
            const mockResponse = JSON.stringify({
              fixes: [
                {
                  errorType: 'syntax',
                  description: 'Fix syntax error',
                  suggestedFix: generateValidCodeForLanguage(language, 'fixed'),
                  explanation: 'This fix addresses the syntax issue',
                  confidence: 0.9
                }
              ]
            });
            
            mockedOllamaClient.generate.mockResolvedValue(mockResponse);

            const fixes = await aiCodeAssistanceService.suggestErrorFixes(errorMessage, code, language);

            // Property 1: Should return valid fixes array
            expect(fixes).toBeDefined();
            expect(Array.isArray(fixes)).toBe(true);

            if (fixes.length > 0) {
              fixes.forEach(fix => {
                // Property 2: Each fix should have required fields
                expect(fix.errorType).toBeDefined();
                expect(typeof fix.errorType).toBe('string');
                
                expect(fix.description).toBeDefined();
                expect(typeof fix.description).toBe('string');
                expect(fix.description.length).toBeGreaterThan(0);
                
                expect(fix.suggestedFix).toBeDefined();
                expect(typeof fix.suggestedFix).toBe('string');
                expect(fix.suggestedFix.trim().length).toBeGreaterThan(0);
                
                expect(fix.explanation).toBeDefined();
                expect(typeof fix.explanation).toBe('string');
                
                // Property 3: Confidence should be between 0 and 1
                expect(fix.confidence).toBeGreaterThanOrEqual(0);
                expect(fix.confidence).toBeLessThanOrEqual(1);
                
                // Property 4: Suggested fix should be syntactically plausible
                validateCodeSyntaxForLanguage(fix.suggestedFix, language);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    /**
     * Property Test: Documentation generation should produce valid documentation
     * For any code input, documentation should:
     * 1. Not be empty
     * 2. Use appropriate format for the language
     * 3. Be longer than trivial comments
     */
    it('should generate valid documentation for any code', async () => {
      mockedOllamaClient.isAvailable.mockResolvedValue(true);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            code: fc.string({ minLength: 10, maxLength: 300 }),
            language: fc.constantFrom('javascript', 'typescript', 'python', 'java')
          }),
          async ({ code, language }) => {
            // Mock a valid documentation response
            const mockResponse = JSON.stringify({
              type: 'function',
              documentation: `This ${language} code performs important operations and returns a result`,
              format: getExpectedDocFormat(language)
            });
            
            mockedOllamaClient.generate.mockResolvedValue(mockResponse);

            const documentation = await aiCodeAssistanceService.generateDocumentation(code, language);

            // Property 1: Documentation should exist and be meaningful
            expect(documentation).toBeDefined();
            expect(documentation.documentation).toBeDefined();
            expect(typeof documentation.documentation).toBe('string');
            expect(documentation.documentation.trim().length).toBeGreaterThan(0);
            
            // Property 2: Type should be valid
            expect(documentation.type).toBeDefined();
            expect(['function', 'class', 'variable', 'module']).toContain(documentation.type);
            
            // Property 3: Format should be appropriate for language
            expect(documentation.format).toBeDefined();
            expect(['jsdoc', 'docstring', 'inline', 'markdown']).toContain(documentation.format);
            
            // Property 4: Documentation should be substantial (not just a single word)
            expect(documentation.documentation.split(' ').length).toBeGreaterThan(2);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    /**
     * Property Test: All advanced features should handle service unavailability
     */
    it('should handle unavailable service gracefully for all advanced features', async () => {
      mockedOllamaClient.isAvailable.mockResolvedValue(false);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            code: fc.string({ minLength: 1, maxLength: 100 }),
            language: fc.constantFrom('javascript', 'python'),
            errorMessage: fc.string({ minLength: 1, maxLength: 50 }),
            comments: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async ({ code, language, errorMessage, comments }) => {
            // Property: All methods should throw appropriate errors when service unavailable
            await expect(aiCodeAssistanceService.getRefactoringSuggestions(code, language))
              .rejects.toThrow('Ollama service is not available');
            
            await expect(aiCodeAssistanceService.generateCodeFromComments(comments, language))
              .rejects.toThrow('Ollama service is not available');
            
            await expect(aiCodeAssistanceService.suggestErrorFixes(errorMessage, code, language))
              .rejects.toThrow('Ollama service is not available');
            
            await expect(aiCodeAssistanceService.generateDocumentation(code, language))
              .rejects.toThrow('Ollama service is not available');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Helper function to generate valid code for a given language
 */
function generateValidCodeForLanguage(language: string, prefix: string): string {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return `function ${prefix}Function() {\n  const result = true;\n  return result;\n}`;
    case 'python':
      return `def ${prefix}_function():\n    result = True\n    return result`;
    case 'java':
      return `public class ${prefix.charAt(0).toUpperCase() + prefix.slice(1)} {\n    public boolean method() {\n        return true;\n    }\n}`;
    case 'cpp':
      return `bool ${prefix}_function() {\n    bool result = true;\n    return result;\n}`;
    default:
      return `// ${prefix} code`;
  }
}

/**
 * Helper function to validate code syntax for a language
 */
function validateCodeSyntaxForLanguage(code: string, language: string): void {
  // Basic syntax validation - check for language-appropriate patterns
  switch (language) {
    case 'javascript':
    case 'typescript':
      // Should not contain Python-specific syntax
      expect(code).not.toMatch(/def\s+\w+\s*\(/);
      expect(code).not.toMatch(/^\s*#/m); // Python comments
      // Should contain JS-like patterns if it's actual code (not just comments)
      if (code.includes('(') || code.includes('{')) {
        // If it looks like code, it should have JS-like structure
        expect(code).toMatch(/[{}();]|function|const|let|var|=>/);
      }
      break;
    case 'python':
      // Should not contain JavaScript-specific syntax
      expect(code).not.toMatch(/function\s+\w+\s*\(/);
      expect(code).not.toMatch(/const\s+\w+\s*=/);
      expect(code).not.toMatch(/var\s+\w+\s*=/);
      // Should not have braces for blocks (excluding strings and comments)
      const nonStringLines = code.split('\n').filter(line => 
        !line.includes('"') && !line.includes("'") && !line.trim().startsWith('#')
      );
      const nonStringCode = nonStringLines.join('\n');
      expect(nonStringCode).not.toMatch(/\{\s*$/m);
      expect(nonStringCode).not.toMatch(/^\s*\}/m);
      break;
    case 'java':
      // Should contain Java-like patterns if it's actual code
      if (code.includes('(') || code.includes('{')) {
        expect(code).toMatch(/class|public|private|void|int|String|boolean/);
      }
      // Should not contain Python def syntax
      expect(code).not.toMatch(/def\s+\w+\s*\(/);
      break;
  }
  
  // General validation: code should not be just whitespace
  expect(code.trim().length).toBeGreaterThan(0);
}

/**
 * Helper function to get expected documentation format for language
 */
function getExpectedDocFormat(language: string): string {
  switch (language) {
    case 'javascript':
    case 'typescript':
    case 'java':
      return 'jsdoc';
    case 'python':
      return 'docstring';
    default:
      return 'inline';
  }
}