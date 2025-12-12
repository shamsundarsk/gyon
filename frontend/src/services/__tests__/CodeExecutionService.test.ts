import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CodeExecutionService } from '../CodeExecutionService';

// Mock Worker for testing
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  
  postMessage(_data: any) {
    // Simulate successful execution
    setTimeout(() => {
      if (this.onmessage) {
        const result = {
          output: ['[LOG] Test output'],
          errors: [],
          executionTime: 10.5,
          success: true
        };
        this.onmessage({ data: result } as MessageEvent);
      }
    }, 10);
  }
  
  terminate() {
    // Mock terminate
  }
}

// Mock global Worker
(globalThis as any).Worker = MockWorker as any;
(globalThis as any).URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn()
} as any;

describe('CodeExecutionService', () => {
  let service: CodeExecutionService;

  beforeEach(() => {
    // Reset singleton instance
    (CodeExecutionService as any).instance = null;
    service = CodeExecutionService.getInstance();
  });

  test('should be a singleton', () => {
    const service1 = CodeExecutionService.getInstance();
    const service2 = CodeExecutionService.getInstance();
    expect(service1).toBe(service2);
  });

  test('should support JavaScript and TypeScript', () => {
    expect(service.canExecute('javascript')).toBe(true);
    expect(service.canExecute('typescript')).toBe(true);
    expect(service.canExecute('python')).toBe(false);
    
    expect(service.getSupportedLanguages()).toEqual(['javascript', 'typescript']);
  });

  test('should execute JavaScript code', async () => {
    const code = 'console.log("Hello, World!");';
    const result = await service.executeJavaScript(code);
    
    expect(result.success).toBe(true);
    expect(result.output).toEqual(['[LOG] Test output']);
    expect(result.errors).toEqual([]);
    expect(typeof result.executionTime).toBe('number');
  });

  test('should execute TypeScript code', async () => {
    const code = 'const message: string = "Hello"; console.log(message);';
    const result = await service.executeTypeScript(code);
    
    expect(result.success).toBe(true);
    expect(result.output).toEqual(['[LOG] Test output']);
  });

  test('should manage console messages', () => {
    expect(service.getConsoleMessages()).toEqual([]);
    
    service.addConsoleMessage('log', 'Test message');
    service.addConsoleMessage('error', 'Error message');
    
    const messages = service.getConsoleMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].type).toBe('log');
    expect(messages[0].message).toBe('Test message');
    expect(messages[1].type).toBe('error');
    expect(messages[1].message).toBe('Error message');
  });

  test('should clear console messages', () => {
    service.addConsoleMessage('log', 'Test message');
    expect(service.getConsoleMessages()).toHaveLength(1);
    
    service.clearConsole();
    expect(service.getConsoleMessages()).toHaveLength(0);
  });

  test('should notify listeners on console updates', () => {
    const listener = vi.fn();
    const unsubscribe = service.onConsoleUpdate(listener);
    
    service.addConsoleMessage('log', 'Test message');
    
    expect(listener).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'log',
        message: 'Test message'
      })
    ]);
    
    unsubscribe();
    service.addConsoleMessage('log', 'Another message');
    
    // Should not be called after unsubscribe
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('should limit console messages to 1000', () => {
    // Add 1001 messages
    for (let i = 0; i < 1001; i++) {
      service.addConsoleMessage('log', `Message ${i}`);
    }
    
    const messages = service.getConsoleMessages();
    expect(messages).toHaveLength(1000);
    expect(messages[0].message).toBe('Message 1'); // First message should be removed
    expect(messages[999].message).toBe('Message 1000'); // Last message should be kept
  });

  test('should dispose resources', () => {
    const listener = vi.fn();
    service.onConsoleUpdate(listener);
    service.addConsoleMessage('log', 'Test');
    
    expect(service.getConsoleMessages()).toHaveLength(1);
    
    service.dispose();
    
    expect(service.getConsoleMessages()).toHaveLength(0);
    
    // Adding message after dispose should not notify listeners
    service.addConsoleMessage('log', 'After dispose');
    expect(listener).toHaveBeenCalledTimes(1); // Only the first call
  });
});