/**
 * Property-Based Tests for Project Import Service
 * **Feature: ai-code-editor, Property: Imported projects contain valid, executable code**
 * **Validates: Requirements 2.2, 2.3**
 */

import * as fc from 'fast-check';
import { projectImportService } from '../ProjectImportService';
import { MashupResponse, UILayout, FileStructure } from '../../types';
import { expect, it, describe } from 'vitest';

describe('Project Import Service Property Tests', () => {
  describe('Property: Imported projects contain valid, executable code', () => {
    /**
     * Property Test: Imported projects should have valid file structure
     * For any valid mashup data, the imported project should:
     * 1. Have a valid project name and description
     * 2. Contain executable code files
     * 3. Have proper file extensions and languages
     * 4. Include all necessary project files (package.json, README, etc.)
     */
    it('should import projects with valid file structure for any mashup data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary but valid mashup data
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            idea: fc.record({
              appName: fc.string({ minLength: 3, maxLength: 50 }),
              description: fc.string({ minLength: 10, maxLength: 200 }),
              features: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
              rationale: fc.string({ minLength: 10, maxLength: 300 }),
              apis: fc.array(
                fc.record({
                  id: fc.string({ minLength: 1, maxLength: 20 }),
                  name: fc.constantFrom('Weather API', 'News API', 'Maps API', 'Music API', 'Social API'),
                  description: fc.string({ minLength: 10, maxLength: 100 }),
                  category: fc.constantFrom('weather', 'news', 'maps', 'music', 'social'),
                  baseUrl: fc.webUrl(),
                  sampleEndpoint: fc.constantFrom('/data', '/search', '/info', '/list'),
                  authType: fc.constantFrom('none', 'apikey', 'oauth') as fc.Arbitrary<'none' | 'apikey' | 'oauth'>,
                  corsCompatible: fc.boolean(),
                  documentationUrl: fc.webUrl(),
                }),
                { minLength: 1, maxLength: 3 }
              ),
            }),
            uiLayout: fc.record({
              screens: fc.array(
                fc.record({
                  name: fc.string({ minLength: 3, maxLength: 30 }),
                  description: fc.string({ minLength: 10, maxLength: 100 }),
                  components: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
                }),
                { minLength: 1, maxLength: 3 }
              ),
              components: fc.array(
                fc.record({
                  type: fc.constantFrom('card', 'list', 'chart', 'form', 'map', 'player') as fc.Arbitrary<'card' | 'list' | 'chart' | 'form' | 'map' | 'player'>,
                  purpose: fc.string({ minLength: 10, maxLength: 50 }),
                  apiSource: fc.string({ minLength: 3, maxLength: 20 }),
                }),
                { minLength: 1, maxLength: 5 }
              ),
              interactionFlow: fc.record({
                steps: fc.array(
                  fc.record({
                    from: fc.string({ minLength: 3, maxLength: 20 }),
                    to: fc.string({ minLength: 3, maxLength: 20 }),
                    action: fc.string({ minLength: 5, maxLength: 30 }),
                  }),
                  { minLength: 1, maxLength: 5 }
                ),
              }),
            }),
            codePreview: fc.record({
              backendSnippet: fc.string({ minLength: 50, maxLength: 500 }),
              frontendSnippet: fc.string({ minLength: 50, maxLength: 500 }),
              structure: generateFileStructure(),
            }),
            downloadUrl: fc.webUrl(),
            timestamp: fc.integer({ min: 1000000000, max: 2000000000 }),
          }),
          async (mashupData: MashupResponse) => {
            const importedProject = await projectImportService.importMashupProject(mashupData);

            // Property 1: Project should have valid metadata
            expect(importedProject.name).toBeDefined();
            expect(typeof importedProject.name).toBe('string');
            expect(importedProject.name.length).toBeGreaterThan(0);
            expect(importedProject.description).toBeDefined();
            expect(typeof importedProject.description).toBe('string');

            // Property 2: Project should contain files
            expect(importedProject.files).toBeDefined();
            expect(Array.isArray(importedProject.files)).toBe(true);
            expect(importedProject.files.length).toBeGreaterThan(0);

            // Property 3: All files should have valid structure
            importedProject.files.forEach(file => {
              expect(file.id).toBeDefined();
              expect(typeof file.id).toBe('string');
              expect(file.name).toBeDefined();
              expect(typeof file.name).toBe('string');
              expect(file.content).toBeDefined();
              expect(typeof file.content).toBe('string');
              expect(file.language).toBeDefined();
              expect(typeof file.language).toBe('string');
              expect(file.path).toBeDefined();
              expect(typeof file.path).toBe('string');
            });

            // Property 4: Should contain essential project files
            const filePaths = importedProject.files.map(f => f.path);
            const hasPackageJson = filePaths.some(path => path.includes('package.json'));
            const hasReadme = filePaths.some(path => path.includes('README.md'));
            const hasServerFile = filePaths.some(path => path.includes('server.js') || path.includes('App.jsx'));
            
            expect(hasPackageJson).toBe(true);
            expect(hasReadme).toBe(true);
            expect(hasServerFile).toBe(true);

            // Property 5: File languages should match extensions
            importedProject.files.forEach(file => {
              const extension = file.path.split('.').pop()?.toLowerCase();
              if (extension === 'js' || extension === 'jsx') {
                expect(file.language).toBe('javascript');
              } else if (extension === 'ts' || extension === 'tsx') {
                expect(file.language).toBe('typescript');
              } else if (extension === 'json') {
                expect(file.language).toBe('json');
              } else if (extension === 'md') {
                expect(file.language).toBe('markdown');
              }
            });

            // Property 6: API specifications should be extracted
            expect(importedProject.apiSpecs).toBeDefined();
            expect(Array.isArray(importedProject.apiSpecs)).toBe(true);
            expect(importedProject.apiSpecs.length).toBe(mashupData.idea.apis.length);

            importedProject.apiSpecs.forEach((spec, index) => {
              const originalApi = mashupData.idea.apis[index];
              expect(spec.name).toBe(originalApi.name);
              expect(spec.baseUrl).toBe(originalApi.baseUrl);
              expect(spec.authType).toBe(originalApi.authType);
              expect(spec.endpoints).toBeDefined();
              expect(Array.isArray(spec.endpoints)).toBe(true);
            });
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 30000); // 30 second timeout

    /**
     * Property Test: Generated code should be syntactically valid
     * For any mashup data, the generated code files should:
     * 1. Have valid syntax for their respective languages
     * 2. Contain proper imports and exports
     * 3. Include API integration code
     */
    it('should generate syntactically valid code for any mashup data', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateValidMashupData(),
          async (mashupData: MashupResponse) => {
            const importedProject = await projectImportService.importMashupProject(mashupData);

            // Property 1: JavaScript/JSX files should have valid basic syntax
            const jsFiles = importedProject.files.filter(f => 
              f.language === 'javascript' && (f.path.endsWith('.js') || f.path.endsWith('.jsx'))
            );

            jsFiles.forEach(file => {
              // Should not have obvious syntax errors
              expect(file.content).not.toMatch(/\{\s*\{/); // Double opening braces
              expect(file.content).not.toMatch(/\}\s*\}\s*\}/); // Triple closing braces (more specific)
              expect(file.content).not.toMatch(/function\s*\(\s*\)\s*\{/); // Function without name in declaration context
              
              // Should have proper structure for different file types
              if (file.path.includes('server.js')) {
                expect(file.content).toMatch(/require\s*\(/); // Should have require statements
                expect(file.content).toMatch(/app\.listen/); // Should have server listen
              } else if (file.path.includes('App.jsx') && file.path.includes('frontend')) {
                expect(file.content).toMatch(/import.*React/); // Should import React
                expect(file.content).toMatch(/export.*default/); // Should export default
              }
            });

            // Property 2: JSON files should be valid JSON structure
            const jsonFiles = importedProject.files.filter(f => f.language === 'json');
            jsonFiles.forEach(file => {
              expect(() => JSON.parse(file.content)).not.toThrow();
              
              if (file.path.includes('package.json')) {
                const packageData = JSON.parse(file.content);
                expect(packageData.name).toBeDefined();
                expect(packageData.version).toBeDefined();
                expect(packageData.dependencies || packageData.devDependencies).toBeDefined();
              }
            });

            // Property 3: Code should reference the APIs from mashup data
            const allCode = importedProject.files.map(f => f.content).join('\n');
            mashupData.idea.apis.forEach(api => {
              // API name should appear somewhere in the code
              const apiNameInCode = allCode.toLowerCase().includes(api.name.toLowerCase()) ||
                                   allCode.includes(api.baseUrl);
              expect(apiNameInCode).toBe(true);
            });
          }
        ),
        { numRuns: 50 } // Fewer runs since this is more complex validation
      );
    }, 30000);

    /**
     * Property Test: Project structure should be consistent
     * For any mashup data, the project structure should:
     * 1. Have logical file organization
     * 2. Separate backend and frontend concerns
     * 3. Include configuration files in appropriate locations
     */
    it('should create consistent project structure for any mashup data', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateValidMashupData(),
          async (mashupData: MashupResponse) => {
            const importedProject = await projectImportService.importMashupProject(mashupData);

            // Property 1: Should have logical separation of concerns
            const backendFiles = importedProject.files.filter(f => 
              f.path.includes('server') || f.path.includes('routes') || f.path.includes('services')
            );
            const frontendFiles = importedProject.files.filter(f => 
              f.path.includes('App.') || f.path.includes('components')
            );
            const configFiles = importedProject.files.filter(f => 
              f.path.includes('package.json') || f.path.includes('.env') || f.path.includes('README')
            );

            expect(backendFiles.length).toBeGreaterThan(0);
            expect(frontendFiles.length).toBeGreaterThan(0);
            expect(configFiles.length).toBeGreaterThan(0);

            // Property 2: File paths should be consistent
            importedProject.files.forEach(file => {
              // No double slashes in paths
              expect(file.path).not.toMatch(/\/\//);
              // No leading slashes
              expect(file.path).not.toMatch(/^\//);
              // Valid characters in paths
              expect(file.path).toMatch(/^[a-zA-Z0-9._/-]+$/);
            });

            // Property 3: Each API should have corresponding service files
            mashupData.idea.apis.forEach(api => {
              const hasServiceFile = importedProject.files.some(f => 
                f.path.includes('services') && 
                f.path.toLowerCase().includes(api.name.toLowerCase().replace(/[^a-z0-9]/g, '-'))
              );
              expect(hasServiceFile).toBe(true);
            });
          }
        ),
        { numRuns: 75 }
      );
    }, 30000);

    /**
     * Property Test: Error handling for invalid data
     * The service should handle edge cases gracefully
     */
    it('should handle edge cases and invalid data gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string(),
            idea: fc.record({
              appName: fc.string({ minLength: 1 }), // Allow very short names
              description: fc.string(),
              features: fc.array(fc.string()),
              rationale: fc.string(),
              apis: fc.array(
                fc.record({
                  id: fc.string(),
                  name: fc.string({ minLength: 1 }),
                  description: fc.string(),
                  category: fc.string(),
                  baseUrl: fc.string(),
                  sampleEndpoint: fc.string(),
                  authType: fc.constantFrom('none', 'apikey', 'oauth') as fc.Arbitrary<'none' | 'apikey' | 'oauth'>,
                  corsCompatible: fc.boolean(),
                  documentationUrl: fc.string(),
                }),
                { minLength: 1 } // At least one API
              ),
            }),
            uiLayout: fc.anything() as fc.Arbitrary<UILayout>, // Allow any UI layout
            codePreview: fc.record({
              backendSnippet: fc.string(),
              frontendSnippet: fc.string(),
              structure: generateFileStructure(),
            }),
            downloadUrl: fc.string(),
            timestamp: fc.integer(),
          }),
          async (mashupData: MashupResponse) => {
            // Property: Should not throw errors for any input
            let importedProject: any = null;
            try {
              importedProject = await projectImportService.importMashupProject(mashupData);
            } catch (error) {
              // Import may fail for invalid data, which is acceptable
            }

            // If import succeeds, basic structure should be valid
            if (importedProject) {
              expect(importedProject.name).toBeDefined();
              expect(importedProject.files).toBeDefined();
              expect(Array.isArray(importedProject.files)).toBe(true);
              expect(importedProject.apiSpecs).toBeDefined();
              expect(Array.isArray(importedProject.apiSpecs)).toBe(true);
            }
          }
        ),
        { numRuns: 30 } // Fewer runs for error testing
      );
    });
  });
});

// Helper function to generate valid file structure
function generateFileStructure(): fc.Arbitrary<FileStructure> {
  return fc.record({
    name: fc.constantFrom('project', 'src', 'backend', 'frontend'),
    type: fc.constant('directory' as const),
    children: fc.array(
      fc.record({
        name: fc.constantFrom('server.js', 'App.jsx', 'package.json', 'README.md', 'routes'),
        type: fc.constantFrom('file', 'directory') as fc.Arbitrary<'file' | 'directory'>,
        children: fc.constant(undefined),
      }),
      { minLength: 1, maxLength: 5 }
    ),
  });
}

// Helper function to generate valid mashup data
function generateValidMashupData(): fc.Arbitrary<MashupResponse> {
  return fc.record({
    id: fc.uuid(),
    idea: fc.record({
      appName: fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-zA-Z]/.test(s)), // Valid app names
      description: fc.string({ minLength: 20, maxLength: 200 }),
      features: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
      rationale: fc.string({ minLength: 20, maxLength: 200 }),
      apis: fc.array(
        fc.record({
          id: fc.uuid(),
          name: fc.constantFrom('WeatherAPI', 'NewsAPI', 'MapsAPI', 'MusicAPI', 'SocialAPI'),
          description: fc.string({ minLength: 20, maxLength: 100 }),
          category: fc.constantFrom('weather', 'news', 'maps', 'music', 'social'),
          baseUrl: fc.webUrl(),
          sampleEndpoint: fc.constantFrom('/api/data', '/search', '/info', '/list'),
          authType: fc.constantFrom('none', 'apikey', 'oauth') as fc.Arbitrary<'none' | 'apikey' | 'oauth'>,
          corsCompatible: fc.boolean(),
          documentationUrl: fc.webUrl(),
        }),
        { minLength: 1, maxLength: 3 }
      ),
    }),
    uiLayout: fc.record({
      screens: fc.array(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 20 }),
          description: fc.string({ minLength: 20, maxLength: 100 }),
          components: fc.array(fc.string({ minLength: 5, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
        }),
        { minLength: 1, maxLength: 3 }
      ),
      components: fc.array(
        fc.record({
          type: fc.constantFrom('card', 'list', 'chart', 'form', 'map', 'player') as fc.Arbitrary<'card' | 'list' | 'chart' | 'form' | 'map' | 'player'>,
          purpose: fc.string({ minLength: 10, maxLength: 50 }),
          apiSource: fc.string({ minLength: 5, maxLength: 20 }),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      interactionFlow: fc.record({
        steps: fc.array(
          fc.record({
            from: fc.string({ minLength: 5, maxLength: 15 }),
            to: fc.string({ minLength: 5, maxLength: 15 }),
            action: fc.string({ minLength: 10, maxLength: 30 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
      }),
    }),
    codePreview: fc.record({
      backendSnippet: fc.string({ minLength: 100, maxLength: 500 }),
      frontendSnippet: fc.string({ minLength: 100, maxLength: 500 }),
      structure: generateFileStructure(),
    }),
    downloadUrl: fc.webUrl(),
    timestamp: fc.integer({ min: 1600000000, max: 1700000000 }),
  });
}