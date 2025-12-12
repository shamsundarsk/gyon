/**
 * Code Execution Service
 * Provides safe code execution capabilities for JavaScript/TypeScript in a sandboxed environment
 */

export interface ExecutionResult {
  output: string[];
  errors: string[];
  executionTime: number;
  success: boolean;
}

export interface ConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
}

export class CodeExecutionService {
  private static instance: CodeExecutionService;
  private worker: Worker | null = null;
  private consoleMessages: ConsoleMessage[] = [];
  private listeners: ((messages: ConsoleMessage[]) => void)[] = [];

  private constructor() {
    this.initializeWorker();
  }

  static getInstance(): CodeExecutionService {
    if (!CodeExecutionService.instance) {
      CodeExecutionService.instance = new CodeExecutionService();
    }
    return CodeExecutionService.instance;
  }

  private initializeWorker(): void {
    // Create a web worker for safe code execution
    const workerCode = `
      let consoleOutput = [];
      
      // Override console methods to capture output
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };
      
      console.log = (...args) => {
        consoleOutput.push({ type: 'log', message: args.map(arg => String(arg)).join(' '), timestamp: new Date().toISOString() });
        originalConsole.log(...args);
      };
      
      console.error = (...args) => {
        consoleOutput.push({ type: 'error', message: args.map(arg => String(arg)).join(' '), timestamp: new Date().toISOString() });
        originalConsole.error(...args);
      };
      
      console.warn = (...args) => {
        consoleOutput.push({ type: 'warn', message: args.map(arg => String(arg)).join(' '), timestamp: new Date().toISOString() });
        originalConsole.warn(...args);
      };
      
      console.info = (...args) => {
        consoleOutput.push({ type: 'info', message: args.map(arg => String(arg)).join(' '), timestamp: new Date().toISOString() });
        originalConsole.info(...args);
      };
      
      self.onmessage = function(e) {
        const { code, timeout = 5000 } = e.data;
        consoleOutput = [];
        
        const startTime = performance.now();
        let result = {
          output: [],
          errors: [],
          executionTime: 0,
          success: false
        };
        
        try {
          // Set up timeout
          const timeoutId = setTimeout(() => {
            throw new Error('Execution timeout: Code took too long to execute');
          }, timeout);
          
          // Execute the code in a try-catch block
          const func = new Function(code);
          const returnValue = func();
          
          clearTimeout(timeoutId);
          
          // If there's a return value, add it to console output
          if (returnValue !== undefined) {
            console.log('Return value:', returnValue);
          }
          
          result.success = true;
        } catch (error) {
          result.errors.push(error.message || String(error));
          console.error('Execution error:', error.message || String(error));
        }
        
        result.executionTime = performance.now() - startTime;
        result.output = consoleOutput.map(msg => \`[\${msg.type.toUpperCase()}] \${msg.message}\`);
        
        self.postMessage(result);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  async executeCode(code: string, timeout: number = 5000): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, timeout + 1000); // Add buffer to worker timeout

      this.worker.onmessage = (e) => {
        clearTimeout(timeoutId);
        const result = e.data as ExecutionResult;
        
        // Add messages to console history
        result.output.forEach(output => {
          const [type, ...messageParts] = output.split('] ');
          const messageType = type.substring(1).toLowerCase() as 'log' | 'error' | 'warn' | 'info';
          const message = messageParts.join('] ');
          
          this.addConsoleMessage(messageType, message);
        });
        
        resolve(result);
      };

      this.worker.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Worker error: ${error.message}`));
      };

      this.worker.postMessage({ code, timeout });
    });
  }

  async executeJavaScript(code: string): Promise<ExecutionResult> {
    return this.executeCode(code);
  }

  async executeTypeScript(code: string): Promise<ExecutionResult> {
    // For TypeScript, we'll need to transpile first
    // For now, we'll treat it as JavaScript (basic support)
    // In a full implementation, you'd use the TypeScript compiler API
    try {
      // Remove TypeScript-specific syntax for basic execution
      const jsCode = this.basicTypeScriptToJavaScript(code);
      return this.executeCode(jsCode);
    } catch (error) {
      return {
        output: [],
        errors: [`TypeScript compilation error: ${error instanceof Error ? error.message : String(error)}`],
        executionTime: 0,
        success: false
      };
    }
  }

  private basicTypeScriptToJavaScript(tsCode: string): string {
    // Basic TypeScript to JavaScript conversion
    // Remove type annotations, interfaces, etc.
    let jsCode = tsCode;
    
    // Remove type annotations from function parameters and return types
    jsCode = jsCode.replace(/:\s*[a-zA-Z_$][a-zA-Z0-9_$]*(\[\])?/g, '');
    
    // Remove interface declarations
    jsCode = jsCode.replace(/interface\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\{[^}]*\}/g, '');
    
    // Remove type aliases
    jsCode = jsCode.replace(/type\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;]+;/g, '');
    
    // Remove generic type parameters
    jsCode = jsCode.replace(/<[^>]*>/g, '');
    
    return jsCode;
  }

  getConsoleMessages(): ConsoleMessage[] {
    return [...this.consoleMessages];
  }

  clearConsole(): void {
    this.consoleMessages = [];
    this.notifyListeners();
  }

  addConsoleMessage(type: 'log' | 'error' | 'warn' | 'info', message: string): void {
    const consoleMessage: ConsoleMessage = {
      type,
      message,
      timestamp: new Date()
    };
    
    this.consoleMessages.push(consoleMessage);
    
    // Keep only last 1000 messages to prevent memory issues
    if (this.consoleMessages.length > 1000) {
      this.consoleMessages = this.consoleMessages.slice(-1000);
    }
    
    this.notifyListeners();
  }

  onConsoleUpdate(callback: (messages: ConsoleMessage[]) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.consoleMessages]));
  }

  // Check if code can be executed
  canExecute(language: string): boolean {
    return ['javascript', 'typescript'].includes(language.toLowerCase());
  }

  // Get supported languages for execution
  getSupportedLanguages(): string[] {
    return ['javascript', 'typescript'];
  }

  // Cleanup
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.listeners = [];
    this.consoleMessages = [];
  }
}

export default CodeExecutionService;