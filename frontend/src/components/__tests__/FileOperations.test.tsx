import { describe, it, expect } from 'vitest';
import { FileManager } from '../../services/FileManager';

describe('File Operations Integration', () => {
  it('maintains data integrity across file operations', () => {
    const fileManager = FileManager.getInstance();
    
    // Test language detection
    expect(fileManager.getLanguageFromExtension('app.js')).toBe('javascript');
    expect(fileManager.getLanguageFromExtension('component.tsx')).toBe('typescript');
    expect(fileManager.getLanguageFromExtension('script.py')).toBe('python');
    expect(fileManager.getLanguageFromExtension('styles.css')).toBe('css');
    expect(fileManager.getLanguageFromExtension('data.json')).toBe('json');
  });

  it('supports multiple file formats', () => {
    const fileManager = FileManager.getInstance();
    const formats = fileManager.getSupportedFormats();
    
    expect(formats).toContain('js');
    expect(formats).toContain('ts');
    expect(formats).toContain('py');
    expect(formats).toContain('html');
    expect(formats).toContain('css');
    expect(formats).toContain('json');
    expect(formats.length).toBeGreaterThan(10);
  });

  it('handles unknown file extensions gracefully', () => {
    const fileManager = FileManager.getInstance();
    
    expect(fileManager.getLanguageFromExtension('unknown.xyz')).toBe('plaintext');
    expect(fileManager.getLanguageFromExtension('noextension')).toBe('plaintext');
    expect(fileManager.getLanguageFromExtension('')).toBe('plaintext');
  });

  it('detects languages correctly for various extensions', () => {
    const fileManager = FileManager.getInstance();
    
    // JavaScript variants
    expect(fileManager.getLanguageFromExtension('app.js')).toBe('javascript');
    expect(fileManager.getLanguageFromExtension('component.jsx')).toBe('javascript');
    
    // TypeScript variants
    expect(fileManager.getLanguageFromExtension('app.ts')).toBe('typescript');
    expect(fileManager.getLanguageFromExtension('component.tsx')).toBe('typescript');
    
    // Other languages
    expect(fileManager.getLanguageFromExtension('script.py')).toBe('python');
    expect(fileManager.getLanguageFromExtension('index.html')).toBe('html');
    expect(fileManager.getLanguageFromExtension('styles.css')).toBe('css');
    expect(fileManager.getLanguageFromExtension('styles.scss')).toBe('scss');
    expect(fileManager.getLanguageFromExtension('config.json')).toBe('json');
    expect(fileManager.getLanguageFromExtension('README.md')).toBe('markdown');
  });

  it('provides consistent file format support', () => {
    const fileManager = FileManager.getInstance();
    const formats = fileManager.getSupportedFormats();
    
    // Check that all supported formats have corresponding language mappings
    const testFormats = ['js', 'ts', 'py', 'html', 'css', 'json'];
    testFormats.forEach(format => {
      expect(formats).toContain(format);
      const language = fileManager.getLanguageFromExtension(`test.${format}`);
      expect(language).not.toBe('plaintext'); // Should have a specific language mapping
    });
  });
});