import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiAssistanceService } from '../services/ai-assistance.service';
import './SmartAIAssistant.css';

interface SmartAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentFile?: {
    name: string;
    content: string;
    language: string;
  };
  onCodeInsert?: (code: string) => void;
  onCodeReplace?: (oldCode: string, newCode: string) => void;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'suggestion';
  content: string;
  timestamp: Date;
  codeBlock?: string;
  language?: string;
  metadata?: {
    confidence?: number;
    type?: string;
    action?: 'insert' | 'replace' | 'explain';
  };
}

interface SmartSuggestion {
  id: string;
  type: 'fix' | 'optimize' | 'refactor' | 'document' | 'complete';
  title: string;
  description: string;
  code?: string;
  confidence: number;
  action: () => void;
}

export const SmartAIAssistant: React.FC<SmartAIAssistantProps> = ({
  isOpen,
  onClose,
  currentFile,
  onCodeInsert,
  onCodeReplace,
  selectedText,
  cursorPosition: _cursorPosition
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize with welcome message and analyze current file
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'system',
        content: '🚀 Smart AI Assistant is ready! I can help you write, explain, fix, and optimize your code. Just ask me anything or select code for instant suggestions.',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      if (currentFile) {
        analyzeCurrentFile();
      }
    }
  }, [isOpen, currentFile]);

  // Analyze current file for smart suggestions
  const analyzeCurrentFile = useCallback(async () => {
    if (!currentFile || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const suggestions: SmartSuggestion[] = [];
      const content = currentFile.content;
      const language = currentFile.language;

      // Check for common issues and opportunities
      if (content.includes('console.log')) {
        suggestions.push({
          id: 'remove-console',
          type: 'optimize',
          title: 'Remove Debug Statements',
          description: 'Found console.log statements that should be removed for production',
          confidence: 0.8,
          action: () => handleQuickAction('Remove all console.log statements from this file')
        });
      }

      if (content.includes('// TODO') || content.includes('// FIXME')) {
        suggestions.push({
          id: 'implement-todos',
          type: 'complete',
          title: 'Implement TODOs',
          description: 'Found TODO/FIXME comments that need implementation',
          confidence: 0.9,
          action: () => handleQuickAction('Implement all TODO and FIXME items in this file')
        });
      }

      // Language-specific suggestions
      if (language === 'javascript' || language === 'typescript') {
        if (!content.includes('try') && content.includes('await')) {
          suggestions.push({
            id: 'add-error-handling',
            type: 'fix',
            title: 'Add Error Handling',
            description: 'Async operations should have proper error handling',
            confidence: 0.85,
            action: () => handleQuickAction('Add try-catch blocks for async operations')
          });
        }

        if (content.includes('var ')) {
          suggestions.push({
            id: 'modernize-vars',
            type: 'refactor',
            title: 'Modernize Variables',
            description: 'Replace var with const/let for better scoping',
            confidence: 0.9,
            action: () => handleQuickAction('Replace all var declarations with const or let')
          });
        }

        if (!content.includes('/**') && content.includes('function')) {
          suggestions.push({
            id: 'add-jsdoc',
            type: 'document',
            title: 'Add Documentation',
            description: 'Functions should have JSDoc documentation',
            confidence: 0.7,
            action: () => handleQuickAction('Add JSDoc documentation to all functions')
          });
        }
      }

      // Security suggestions
      if (content.includes('eval(') || content.includes('innerHTML =')) {
        suggestions.push({
          id: 'security-review',
          type: 'fix',
          title: 'Security Review Needed',
          description: 'Potential security vulnerabilities detected',
          confidence: 0.95,
          action: () => handleQuickAction('Review and fix potential security issues')
        });
      }

      setSmartSuggestions(suggestions.slice(0, 4)); // Limit to 4 suggestions
    } catch (error) {
      console.warn('Failed to analyze file:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentFile, isAnalyzing]);

  const addMessage = (type: ChatMessage['type'], content: string, codeBlock?: string, language?: string, metadata?: ChatMessage['metadata']) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      codeBlock,
      language,
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      await processUserMessage(userMessage);
    } catch (error) {
      console.error('AI Assistant error:', error);
      addMessage('ai', 'Sorry, I encountered an error. Please try again or rephrase your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const processUserMessage = async (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Determine intent and handle accordingly
    if (lowerMessage.includes('explain') && (selectedText || currentFile)) {
      await handleExplainCode(selectedText || currentFile?.content || '');
    } else if (lowerMessage.includes('fix') && currentFile) {
      await handleFixCode();
    } else if (lowerMessage.includes('refactor') && (selectedText || currentFile)) {
      await handleRefactorCode(selectedText || currentFile?.content || '');
    } else if (lowerMessage.includes('document') && (selectedText || currentFile)) {
      await handleDocumentCode(selectedText || currentFile?.content || '');
    } else if (lowerMessage.includes('optimize') && (selectedText || currentFile)) {
      await handleOptimizeCode(selectedText || currentFile?.content || '');
    } else {
      // General code generation or assistance
      await handleGenerateCode(message);
    }
  };

  const handleExplainCode = async (code: string) => {
    if (!currentFile) return;

    try {
      const explanation = await aiAssistanceService.explainCode(code, currentFile.language);
      
      let response = explanation.explanation;
      if (explanation.suggestions && explanation.suggestions.length > 0) {
        response += '\n\n**Suggestions:**\n' + explanation.suggestions.map(s => `• ${s}`).join('\n');
      }

      addMessage('ai', response, undefined, undefined, { 
        confidence: 0.9, 
        type: 'explanation',
        action: 'explain'
      });
    } catch (error) {
      addMessage('ai', 'Failed to explain the code. Please try again.');
    }
  };

  const handleFixCode = async () => {
    if (!currentFile) return;

    try {
      const fixes = await aiAssistanceService.suggestErrorFixes('General code review', currentFile.content, currentFile.language);
      
      if (fixes.length > 0) {
        const bestFix = fixes[0];
        addMessage('ai', bestFix.description, bestFix.suggestedFix, currentFile.language, {
          confidence: bestFix.confidence,
          type: 'fix',
          action: 'replace'
        });
      } else {
        addMessage('ai', 'No issues found in your code! It looks good to me. 👍');
      }
    } catch (error) {
      addMessage('ai', 'Failed to analyze the code for fixes. Please try again.');
    }
  };

  const handleRefactorCode = async (code: string) => {
    if (!currentFile) return;

    try {
      const suggestions = await aiAssistanceService.getRefactoringSuggestions(code, currentFile.language);
      
      if (suggestions.length > 0) {
        const bestSuggestion = suggestions[0];
        addMessage('ai', `**${bestSuggestion.title}**\n\n${bestSuggestion.description}`, 
          bestSuggestion.suggestedCode, currentFile.language, {
          confidence: bestSuggestion.confidence,
          type: 'refactor',
          action: 'replace'
        });
      } else {
        addMessage('ai', 'Your code is already well-structured! No refactoring suggestions at this time.');
      }
    } catch (error) {
      addMessage('ai', 'Failed to generate refactoring suggestions. Please try again.');
    }
  };

  const handleDocumentCode = async (code: string) => {
    if (!currentFile) return;

    try {
      const doc = await aiAssistanceService.generateDocumentation(code, currentFile.language);
      addMessage('ai', 'Here\'s the documentation for your code:', doc.documentation, 'markdown', {
        confidence: 0.8,
        type: 'documentation',
        action: 'insert'
      });
    } catch (error) {
      addMessage('ai', 'Failed to generate documentation. Please try again.');
    }
  };

  const handleOptimizeCode = async (code: string) => {
    if (!currentFile) return;

    try {
      const suggestions = await aiAssistanceService.getRefactoringSuggestions(code, currentFile.language);
      const optimizations = suggestions.filter(s => s.type === 'optimize_performance');
      
      if (optimizations.length > 0) {
        const bestOptimization = optimizations[0];
        addMessage('ai', `**Performance Optimization**\n\n${bestOptimization.description}`, 
          bestOptimization.suggestedCode, currentFile.language, {
          confidence: bestOptimization.confidence,
          type: 'optimization',
          action: 'replace'
        });
      } else {
        addMessage('ai', 'Your code appears to be well-optimized! No performance improvements suggested at this time.');
      }
    } catch (error) {
      addMessage('ai', 'Failed to analyze code for optimizations. Please try again.');
    }
  };

  const handleGenerateCode = async (description: string) => {
    try {
      const code = await aiAssistanceService.generateCode(description, currentFile?.language || 'javascript');
      addMessage('ai', 'Here\'s the generated code:', code, currentFile?.language || 'javascript', {
        confidence: 0.8,
        type: 'generation',
        action: 'insert'
      });
    } catch (error) {
      addMessage('ai', 'Failed to generate code. Please try again with a more specific description.');
    }
  };

  const handleQuickAction = async (action: string) => {
    setInputValue(action);
    await handleSend();
  };

  const handleCodeAction = (message: ChatMessage, action: 'insert' | 'replace') => {
    if (!message.codeBlock) return;

    if (action === 'insert' && onCodeInsert) {
      onCodeInsert(message.codeBlock);
      addMessage('system', '✅ Code inserted into editor!');
    } else if (action === 'replace' && onCodeReplace && selectedText) {
      onCodeReplace(selectedText, message.codeBlock);
      addMessage('system', '✅ Code replaced in editor!');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSuggestionIcon = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'fix':
        return '🔧';
      case 'optimize':
        return '⚡';
      case 'refactor':
        return '🔄';
      case 'document':
        return '📝';
      case 'complete':
        return '✅';
      default:
        return '💡';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="smart-ai-assistant-overlay">
      <div className="smart-ai-assistant-panel">
        <div className="smart-ai-assistant-header">
          <div className="assistant-title">
            <div className="ai-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="title-info">
              <span className="title-text">Smart AI Assistant</span>
              {currentFile && (
                <span className="current-file">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  {currentFile.name}
                </span>
              )}
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="smart-ai-content">
          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && (
            <div className="smart-suggestions">
              <div className="suggestions-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11H1l8-8 8 8"/>
                  <path d="M9 11v10"/>
                </svg>
                Smart Suggestions
                {isAnalyzing && <div className="analyzing-spinner" />}
              </div>
              <div className="suggestions-grid">
                {smartSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className={`smart-suggestion ${suggestion.type}`}
                    onClick={suggestion.action}
                  >
                    <div className="suggestion-icon">{getSuggestionIcon(suggestion.type)}</div>
                    <div className="suggestion-content">
                      <div className="suggestion-title">{suggestion.title}</div>
                      <div className="suggestion-description">{suggestion.description}</div>
                      <div className="suggestion-confidence">
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="ai-messages">
            {messages.map((message) => (
              <div key={message.id} className={`ai-message ai-message-${message.type}`}>
                <div className="message-header">
                  <div className="message-avatar">
                    {message.type === 'user' ? '👤' : message.type === 'ai' ? '🤖' : '⚙️'}
                  </div>
                  <div className="message-info">
                    <span className="message-sender">
                      {message.type === 'user' ? 'You' : message.type === 'ai' ? 'AI Assistant' : 'System'}
                    </span>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                    {message.metadata?.confidence && (
                      <span className="message-confidence">
                        {Math.round(message.metadata.confidence * 100)}% confident
                      </span>
                    )}
                  </div>
                </div>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  {message.codeBlock && (
                    <div className="code-block">
                      <div className="code-header">
                        <span className="code-language">{message.language}</span>
                        <div className="code-actions">
                          <button 
                            className="code-action-btn insert"
                            onClick={() => handleCodeAction(message, 'insert')}
                            title="Insert code"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Insert
                          </button>
                          {selectedText && (
                            <button 
                              className="code-action-btn replace"
                              onClick={() => handleCodeAction(message, 'replace')}
                              title="Replace selected code"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                              </svg>
                              Replace
                            </button>
                          )}
                        </div>
                      </div>
                      <pre className="code-content">
                        <code>{message.codeBlock}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message ai-message-ai">
                <div className="message-header">
                  <div className="message-avatar">🤖</div>
                  <div className="message-info">
                    <span className="message-sender">AI Assistant</span>
                  </div>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="ai-input-area">
            <div className="input-container">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your code, or describe what you want to build..."
                className="ai-input"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="send-button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9"/>
                </svg>
              </button>
            </div>
            <div className="input-hints">
              <span className="hint">💡 Try: "explain this function", "fix any bugs", "add error handling"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAIAssistant;