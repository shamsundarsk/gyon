import React, { useState, useRef, useEffect } from 'react';
import './Terminal.css';

interface TerminalProps {
  onCommand?: (command: string) => Promise<string>;
}

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export const Terminal: React.FC<TerminalProps> = ({ onCommand }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'output',
      content: 'Welcome to AI Code Editor Terminal',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'output',
      content: 'Type "help" for available commands',
      timestamp: new Date()
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [lines]);

  const addLine = (type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setLines(prev => [...prev, newLine]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command line
    addLine('command', `$ ${command}`);
    setIsProcessing(true);

    try {
      let output = '';

      // Built-in commands
      switch (command.toLowerCase().trim()) {
        case 'help':
          output = `Available commands:
  help          - Show this help message
  clear         - Clear terminal
  pwd           - Show current directory
  ls            - List files
  date          - Show current date and time
  whoami        - Show current user
  echo <text>   - Echo text
  node --version - Show Node.js version
  npm --version  - Show npm version`;
          break;
        case 'clear':
          setLines([]);
          setIsProcessing(false);
          return;
        case 'pwd':
          output = '/workspace/ai-code-editor';
          break;
        case 'ls':
          output = `src/
node_modules/
package.json
README.md
tsconfig.json
vite.config.ts`;
          break;
        case 'date':
          output = new Date().toString();
          break;
        case 'whoami':
          output = 'developer';
          break;
        case 'node --version':
          output = 'v18.17.0';
          break;
        case 'npm --version':
          output = '9.6.7';
          break;
        default:
          if (command.startsWith('echo ')) {
            output = command.substring(5);
          } else if (onCommand) {
            output = await onCommand(command);
          } else {
            output = `Command not found: ${command}`;
          }
      }

      addLine('output', output);
    } catch (error) {
      addLine('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      executeCommand(currentCommand);
      setCurrentCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Basic tab completion for common commands
      const commands = ['help', 'clear', 'pwd', 'ls', 'date', 'whoami', 'echo', 'node', 'npm'];
      const matches = commands.filter(cmd => cmd.startsWith(currentCommand.toLowerCase()));
      if (matches.length === 1) {
        setCurrentCommand(matches[0]);
      }
    }
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="terminal-container" onClick={handleTerminalClick}>
      <div className="terminal-header">
        <div className="terminal-controls">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
        </div>
        <div className="terminal-title">Terminal</div>
        <div className="terminal-actions">
          <button
            className="terminal-action-btn"
            onClick={() => setLines([])}
            title="Clear terminal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="terminal-content" ref={terminalRef}>
        {lines.map(line => (
          <div key={line.id} className={`terminal-line terminal-line-${line.type}`}>
            <span className="terminal-line-content">{line.content}</span>
          </div>
        ))}
        
        <div className="terminal-input-line">
          <span className="terminal-prompt">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            disabled={isProcessing}
            placeholder={isProcessing ? "Processing..." : "Type a command..."}
            autoFocus
          />
          {isProcessing && (
            <span className="terminal-spinner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terminal;