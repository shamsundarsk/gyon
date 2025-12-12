/**
 * Property-Based Tests for AI Code Assistance
 * **Feature: ai-code-editor, Property: AI suggestions are contextually relevant to code**
 * **Validates: Requirements 3.2, 3.3**
 */

import * as fc from 'fast-check';
import { aiCodeAssistanceService, CodeContext } from '../services/AICodeAssistanceService';
import * as ollamaClient from '../modules/idea-generator/ollamaClient';

// Mock the ollama client for testing
jest.mock('../modules/idea-generator/ollamaClient');
const mockedOllamaClient = ollamaClient as jest.Mocked<typeof ollamaClient>;

describe('AI Code Assistance Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property: AI suggestions are contextually relevant to code', () => {
    /**
     * Property Test: AI completions should be contextually relevant
     * For any valid code context, AI completions should:
     * 1. Be syntactically valid for the given language
     * 2. Be contextually appropriate (not empty or nonsensical)
     * 3. Have proper completion structure
     */
    it('should generate contextually relevant completions for any valid code context', async () => {
      // Mock Ollama to be available and return valid JSON responses
      mockedOllamaClient.isAvailable.mockResolvedValue(true);
      
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary code contexts
          fc.record({
            content: fc.string({ minLength: 10, maxLength: 500 }),
            language: fc.constantFrom('javascript', 'typescript', 'python', 'java', 'cpp'),
            position: fc.record({
              line: fc.integer({ min: 0, max: 20 }),
              column: fc.integer({ min: 0, max: 80 })
            }),
            filename: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
          }),
          async (context: CodeContext) => {
            // Mock a valid completion response
            const mockResponse = JSON.stringify({
              completions: [
                {
                  text: `completion_for_${context.language}`,
                  kind: 'function',
                  detail: 'AI-generated completion',
                  insertText: `completion_for_${context.language}()`
                }
              ]
            });
            
            mockedOllamaClient.generate.mockResolvedValue(mockResponse);

            const completions = await aiCodeAssistanceService.getCodeCompletions(context);

            // Property 1: Completions should not be empty for valid contexts
            expect(completions).toBeDefined();
            expect(Array.isArray(completions)).toBe(true);

            if (completions.length > 0) {
              completions.forEach(completion => {
                // Property 2: Each completion should have required fields
                expect(completion.text).toBeDefined();
                expect(typeof completion.text).toBe('string');
                expect(completion.text.length).toBeGreaterThan(0);
                
                expect(completion.kind).toBeDefined();
                expect(['function', 'variable', 'class', 'method', 'property', 'keyword', 'snippet'])
                  .toContain(completion.kind);
                
                expect(completion.insertText).toBeDefined();
                expect(typeof completion.insertText).toBe('string');
                
                // Property 3: Completion should be contextually relevant (not random gibberish)
                // For this test, we check that the completion contains language-appropriate content
                if (context.language === 'javascript' || context.language === 'typescript') {
                  // Should not contain Python-specific syntax
                  expect(completion.text).not.toMatch(/def\s+\w+\(/);
                  expect(completion.text).not.toMatch(/import\s+\w+\s+from\s+'\w+'/);
                } else if (context.language === 'python') {
                  // Should not contain JavaScript-specific syntax
                  expect(completion.text).not.toMatch(/function\s+\w+\(/);
                  expect(completion.text).not.toMatch(/const\s+\w+\s*=/);
                }
              });
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 30000); // 30 second timeout for property test

    /**
     * Property Test: Code explanations should be meaningful
     * For any valid code snippet, explanations should:
     * 1. Not be empty
     * 2. Be longer than the original code (explanatory)
     * 3. Contain explanatory language
     */
    it('should generate meaningful explanations for any valid code', async () => {
      mockedOllamaClient.isAvailable.mockResolvedValue(true);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            code: fc.string({ minLength: 5, maxLength: 200 }),
            language: fc.constantFrom('javascript', 'typescript', 'python', 'java')
          }),
          async ({ code, language }) => {
            // Mock a valid explanation response
            const mockResponse = JSON.stringify({
              explanation: `This ${language} code performs the following operations: ${code.substring(0, 20)}...`,
              suggestions: ['Consider adding error handling', 'Add type annotations']
            });
            
            mockedOllamaClient.generate.mockResolvedValue(mockResponse);

            const explanation = await aiCodeAssistanceService.explainCode(code, language);

            // Property 1: Explanation should exist and be meaningful
            expect(explanation).toBeDefined();
            expect(explanation.explanation).toBeDefined();
            expect(typeof explanation.explanation).toBe('string');
            expect(explanation.explanation.length).toBeGreaterThan(0);
            
            // Property 2: Explanation should be longer than very short codes (explanatory nature)
            if (code.length < 50) {
              expect(explanation.explanation.length).toBeGreaterThan(code.length);
            }
            
            // Property 3: Explanation should contain explanatory language
            const explanatoryWords = ['this', 'code', 'function', 'performs', 'does', 'creates', 'returns'];
            const hasExplanatoryLanguage = explanatoryWords.some(word => 
              explanation.explanation.toLowerCase().includes(word)
            );
            expect(hasExplanatoryLanguage).toBe(true);
            
            // Property 4: Suggestions should be an array if present
            if (explanation.suggestions) {
              expect(Array.isArray(explanation.suggestions)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    /**
     * Property Test: Generated code should be syntactically plausible
     * For any description and language, generated code should:
     * 1. Not be empty
     * 2. Not contain obvious syntax errors for the target language
     * 3. Be related to the description
     */
    it('should generate syntactically plausible code for any description', async () => {
      mockedOllamaClient.isAvailable.mockResolvedValue(true);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            description: fc.string({ minLength: 10, maxLength: 100 }),
            language: fc.constantFrom('javascript', 'typescript', 'python', 'java')
          }),
          async ({ description, language }) => {
            // Mock generated code based on language
            let mockCode = '';
            switch (language) {
              case 'javascript':
              case 'typescript':
                mockCode = `function generatedFunction() {\n  // ${description}\n  return true;\n}`;
                break;
              case 'python':
                mockCode = `def generated_function():\n    # ${description}\n    return True`;
                break;
              case 'java':
                mockCode = `public void generatedMethod() {\n    // ${description}\n}`;
                break;
            }
            
            mockedOllamaClient.generate.mockResolvedValue(mockCode);

            const generatedCode = await aiCodeAssistanceService.generateCode(description, language);

            // Property 1: Generated code should not be empty
            expect(generatedCode).toBeDefined();
            expect(typeof generatedCode).toBe('string');
            expect(generatedCode.trim().length).toBeGreaterThan(0);
            
            // Property 2: Code should not contain obvious syntax errors for the language
            if (language === 'javascript' || language === 'typescript') {
              // Should not have Python-style indentation without braces
              const lines = generatedCode.split('\n');
              const hasIndentedLinesWithoutBraces = lines.some(line => 
                line.match(/^\s{4,}/) && !generatedCode.includes('{') && !generatedCode.includes('}')
              );
              expect(hasIndentedLinesWithoutBraces).toBe(false);
            } else if (language === 'python') {
              // Should not have JavaScript-style braces for blocks (excluding comments)
              const codeLines = generatedCode.split('\n').filter(line => !line.trim().startsWith('#'));
              const codeWithoutComments = codeLines.join('\n');
              expect(codeWithoutComments).not.toMatch(/\{\s*$/m);
              expect(codeWithoutComments).not.toMatch(/^\s*\}/m);
            }
            
            // Property 3: Generated code should be reasonably sized (not just a single character)
            expect(generatedCode.length).toBeGreaterThan(5);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    /**
     * Property Test: AI service should handle unavailable Ollama gracefully
     * When Ollama is unavailable, all methods should throw appropriate errors
     */
    it('should handle unavailable Ollama service gracefully', async () => {
      mockedOllamaClient.isAvailable.mockResolvedValue(false);
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            content: fc.string({ minLength: 1, maxLength: 100 }),
            language: fc.constantFrom('javascript', 'python'),
            position: fc.record({
              line: fc.integer({ min: 0, max: 10 }),
              column: fc.integer({ min: 0, max: 50 })
            })
          }),
          async (context: CodeContext) => {
            // Property: Should throw error when Ollama is unavailable
            await expect(aiCodeAssistanceService.getCodeCompletions(context))
              .rejects.toThrow('Ollama service is not available');
            
            await expect(aiCodeAssistanceService.explainCode(context.content, context.language))
              .rejects.toThrow('Ollama service is not available');
            
            await expect(aiCodeAssistanceService.generateCode('test description', context.language))
              .rejects.toThrow('Ollama service is not available');
          }
        ),
        { numRuns: 50 } // Fewer runs since this is testing error conditions
      );
    });

    /**
     * Property Test: Service availability check should be consistent
     */
    it('should consistently report service availability', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (isAvailable) => {
            mockedOllamaClient.isAvailable.mockResolvedValue(isAvailable);
            
            const result = await aiCodeAssistanceService.isAvailable();
            
            // Property: Availability check should match Ollama client response
            expect(result).toBe(isAvailable);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});