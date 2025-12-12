import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import FileManager, { Project } from '../FileManager';

/**
 * **Feature: ai-code-editor, Property 1: Projects maintain independent state and files**
 * **Validates: Requirements 5.2, 5.5**
 */

describe('FileManager Property Tests', () => {
  let fileManager: FileManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    fileManager = FileManager.getInstance();
  });

  describe('Workspace Isolation Properties', () => {
    it('should maintain independent state between projects', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project1Name: fc.string({ minLength: 1, maxLength: 50 }),
            project1Description: fc.string({ maxLength: 200 }),
            project2Name: fc.string({ minLength: 1, maxLength: 50 }),
            project2Description: fc.string({ maxLength: 200 }),
            fileName: fc.string({ minLength: 1, maxLength: 20 }).filter(name => !name.includes('/')),
            fileContent1: fc.string({ maxLength: 1000 }),
            fileContent2: fc.string({ maxLength: 1000 })
          }),
          async ({ project1Name, project1Description, project2Name, project2Description, fileName, fileContent1, fileContent2 }) => {
            // Ensure project names are different
            if (project1Name === project2Name) {
              project2Name = project2Name + '_2';
            }

            // Create two separate projects
            const project1 = await fileManager.createProject(project1Name, project1Description);
            const project2 = await fileManager.createProject(project2Name, project2Description);

            // Add different files to each project
            const file1Path = `${fileName}.txt`;
            const file2Path = `${fileName}_different.txt`;

            await fileManager.createFile(project1.id, file1Path, fileContent1);
            await fileManager.createFile(project2.id, file2Path, fileContent2);

            // Verify that each project has its own independent files
            const retrievedFile1 = await fileManager.getFile(project1.id, file1Path);
            const retrievedFile2 = await fileManager.getFile(project2.id, file2Path);

            // Project 1 should have its file but not project 2's file
            expect(retrievedFile1).not.toBeNull();
            expect(retrievedFile1?.content).toBe(fileContent1);
            expect(await fileManager.getFile(project1.id, file2Path)).toBeNull();

            // Project 2 should have its file but not project 1's file
            expect(retrievedFile2).not.toBeNull();
            expect(retrievedFile2?.content).toBe(fileContent2);
            expect(await fileManager.getFile(project2.id, file1Path)).toBeNull();

            // Verify project metadata is independent
            const reloadedProject1 = await fileManager.getProject(project1.id);
            const reloadedProject2 = await fileManager.getProject(project2.id);

            expect(reloadedProject1?.name).toBe(project1Name);
            expect(reloadedProject1?.description).toBe(project1Description);
            expect(reloadedProject2?.name).toBe(project2Name);
            expect(reloadedProject2?.description).toBe(project2Description);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain file isolation when updating files in different projects', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            projectNames: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 2, maxLength: 5 }),
            fileName: fc.string({ minLength: 1, maxLength: 15 }).filter(name => !name.includes('/')),
            fileContents: fc.array(fc.string({ maxLength: 500 }), { minLength: 2, maxLength: 5 })
          }),
          async ({ projectNames, fileName, fileContents }) => {
            // Ensure unique project names
            const uniqueProjectNames = [...new Set(projectNames)].slice(0, Math.min(projectNames.length, fileContents.length));
            if (uniqueProjectNames.length < 2) {
              uniqueProjectNames.push(`${uniqueProjectNames[0]}_extra`);
            }

            // Create projects
            const projects: Project[] = [];
            for (let i = 0; i < uniqueProjectNames.length; i++) {
              const project = await fileManager.createProject(uniqueProjectNames[i], `Description ${i}`);
              projects.push(project);
            }

            // Add the same filename to each project with different content
            const filePath = `${fileName}.js`;
            for (let i = 0; i < projects.length; i++) {
              const content = fileContents[i % fileContents.length] + `_project_${i}`;
              await fileManager.createFile(projects[i].id, filePath, content);
            }

            // Update files in each project independently
            const updatedContents: string[] = [];
            for (let i = 0; i < projects.length; i++) {
              const newContent = `Updated content for project ${i}: ${Math.random()}`;
              updatedContents.push(newContent);
              await fileManager.updateFile(projects[i].id, filePath, newContent);
            }

            // Verify each project has its own version of the file
            for (let i = 0; i < projects.length; i++) {
              const retrievedFile = await fileManager.getFile(projects[i].id, filePath);
              expect(retrievedFile).not.toBeNull();
              expect(retrievedFile?.content).toBe(updatedContents[i]);

              // Verify this content is not in other projects
              for (let j = 0; j < projects.length; j++) {
                if (i !== j) {
                  const otherFile = await fileManager.getFile(projects[j].id, filePath);
                  expect(otherFile?.content).not.toBe(updatedContents[i]);
                }
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain project isolation when deleting files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project1Name: fc.string({ minLength: 1, maxLength: 30 }),
            project2Name: fc.string({ minLength: 1, maxLength: 30 }),
            sharedFileName: fc.string({ minLength: 1, maxLength: 15 }).filter(name => !name.includes('/')),
            content1: fc.string({ maxLength: 300 }),
            content2: fc.string({ maxLength: 300 })
          }),
          async ({ project1Name, project2Name, sharedFileName, content1, content2 }) => {
            // Ensure different project names
            if (project1Name === project2Name) {
              project2Name = project2Name + '_different';
            }

            // Create two projects
            const project1 = await fileManager.createProject(project1Name, 'Test project 1');
            const project2 = await fileManager.createProject(project2Name, 'Test project 2');

            // Add the same filename to both projects
            const filePath = `${sharedFileName}.txt`;
            await fileManager.createFile(project1.id, filePath, content1);
            await fileManager.createFile(project2.id, filePath, content2);

            // Verify both files exist
            expect(await fileManager.getFile(project1.id, filePath)).not.toBeNull();
            expect(await fileManager.getFile(project2.id, filePath)).not.toBeNull();

            // Delete file from project1 only
            await fileManager.deleteFile(project1.id, filePath);

            // Verify file is deleted from project1 but still exists in project2
            expect(await fileManager.getFile(project1.id, filePath)).toBeNull();
            
            const project2File = await fileManager.getFile(project2.id, filePath);
            expect(project2File).not.toBeNull();
            expect(project2File?.content).toBe(content2);
          }
        ),
        { numRuns: 40 }
      );
    });

    it('should maintain active project state independently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 25 }), { minLength: 3, maxLength: 8 }),
          async (projectNames) => {
            // Ensure unique project names
            const uniqueNames = [...new Set(projectNames)];
            if (uniqueNames.length < 3) {
              uniqueNames.push('extra_project_1', 'extra_project_2', 'extra_project_3');
            }

            // Create multiple projects
            const projects: Project[] = [];
            for (const name of uniqueNames.slice(0, 5)) { // Limit to 5 projects for performance
              const project = await fileManager.createProject(name, `Description for ${name}`);
              projects.push(project);
            }

            // Switch between projects and verify active project state
            for (const project of projects) {
              await fileManager.setActiveProject(project.id);
              
              const activeProjectId = await fileManager.getActiveProjectId();
              const activeProject = await fileManager.getActiveProject();
              
              expect(activeProjectId).toBe(project.id);
              expect(activeProject?.id).toBe(project.id);
              expect(activeProject?.name).toBe(project.name);
              
              // Verify other projects are not active
              for (const otherProject of projects) {
                if (otherProject.id !== project.id) {
                  expect(activeProjectId).not.toBe(otherProject.id);
                }
              }
            }
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});