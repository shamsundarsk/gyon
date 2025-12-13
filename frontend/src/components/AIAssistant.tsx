import React, { useState, useRef, useEffect } from 'react';
import { aiAssistanceService } from '../services/ai-assistance.service';
import './AIAssistant.css';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentFile?: {
    name: string;
    content: string;
    language: string;
  };
  onCodeInsert?: (code: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  codeBlock?: string;
  language?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  currentFile,
  onCodeInsert
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'AI Assistant is ready to help you code! Ask me anything about your code, request explanations, or ask me to generate code for you.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState([
    'Explain this code',
    'Fix any bugs',
    'Add error handling',
    'Optimize performance',
    'Add documentation',
    'Refactor this function'
  ]);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);
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

  // Generate contextual suggestions based on current file
  useEffect(() => {
    if (currentFile && isOpen) {
      generateContextualSuggestions();
    }
  }, [currentFile, isOpen]);

  const generateContextualSuggestions = async () => {
    if (!currentFile) return;

    try {
      const suggestions: string[] = [];
      
      // Analyze code to generate smart suggestions
      const content = currentFile.content;
      const language = currentFile.language;

      // Check for common patterns and suggest improvements
      if (content.includes('console.log')) {
        suggestions.push('Remove debug console.log statements');
      }
      
      if (content.includes('// TODO') || content.includes('// FIXME')) {
        suggestions.push('Implement TODO items');
      }
      
      if (language === 'javascript' || language === 'typescript') {
        if (!content.includes('try') && content.includes('await')) {
          suggestions.push('Add error handling for async operations');
        }
        
        if (content.includes('function') && !content.includes('/**')) {
          suggestions.push('Add JSDoc documentation');
        }
        
        if (content.includes('var ')) {
          suggestions.push('Replace var with const/let');
        }
      }
      
      if (language === 'python') {
        if (!content.includes('def __init__') && content.includes('class ')) {
          suggestions.push('Add constructor to class');
        }
        
        if (!content.includes('"""') && content.includes('def ')) {
          suggestions.push('Add docstrings to functions');
        }
      }
      
      // Check for performance issues
      if (content.includes('for') && content.includes('append')) {
        suggestions.push('Optimize loop performance');
      }
      
      // Security suggestions
      if (content.includes('eval(') || content.includes('innerHTML')) {
        suggestions.push('Review security implications');
      }
      
      // Accessibility suggestions
      if (language === 'html' || content.includes('<')) {
        if (!content.includes('alt=') && content.includes('<img')) {
          suggestions.push('Add alt text to images');
        }
        
        if (!content.includes('aria-') && content.includes('<button')) {
          suggestions.push('Add ARIA labels for accessibility');
        }
      }

      setContextualSuggestions(suggestions.slice(0, 4)); // Limit to 4 suggestions
    } catch (error) {
      console.warn('Failed to generate contextual suggestions:', error);
    }
  };

  const addMessage = (type: ChatMessage['type'], content: string, codeBlock?: string, language?: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      codeBlock,
      language
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
      let response = '';
      let codeBlock = '';
      let language = '';

      // Determine the type of request and handle accordingly
      if (userMessage.toLowerCase().includes('explain') && currentFile) {
        const explanation = await aiAssistanceService.explainCode(currentFile.content, currentFile.language);
        response = explanation.explanation;
        if (explanation.suggestions && explanation.suggestions.length > 0) {
          response += '\n\nSuggestions:\n' + explanation.suggestions.map(s => `• ${s}`).join('\n');
        }
      } else if (userMessage.toLowerCase().includes('fix') && currentFile) {
        const fixes = await aiAssistanceService.suggestErrorFixes('General code review', currentFile.content, currentFile.language);
        if (fixes.length > 0) {
          response = fixes[0].description;
          codeBlock = fixes[0].suggestedFix;
          language = currentFile.language;
        } else {
          response = 'No issues found in your code! It looks good.';
        }
      } else if (userMessage.toLowerCase().includes('refactor') && currentFile) {
        const suggestions = await aiAssistanceService.getRefactoringSuggestions(currentFile.content, currentFile.language);
        if (suggestions.length > 0) {
          response = suggestions[0].description;
          codeBlock = suggestions[0].suggestedCode;
          language = currentFile.language;
        } else {
          response = 'Your code is already well-structured!';
        }
      } else if (userMessage.toLowerCase().includes('generate') || userMessage.toLowerCase().includes('create') || userMessage.toLowerCase().includes('write')) {
        const code = await aiAssistanceService.generateCode(userMessage, currentFile?.language || 'javascript');
        response = 'Here\'s the generated code:';
        codeBlock = code;
        language = currentFile?.language || 'javascript';
      } else if (userMessage.toLowerCase().includes('document') && currentFile) {
        const doc = await aiAssistanceService.generateDocumentation(currentFile.content, currentFile.language);
        response = 'Here\'s the documentation for your code:';
        codeBlock = doc.documentation;
        language = 'markdown';
      } else {
        // General AI assistance - treat as code generation request
        const code = await aiAssistanceService.generateCode(userMessage, currentFile?.language || 'javascript');
        response = 'Here\'s what I generated for you:';
        codeBlock = code;
        language = currentFile?.language || 'javascript';
      }

      addMessage('ai', response, codeBlock, language);
    } catch (error) {
      console.error('AI Assistant error:', error);
      addMessage('ai', 'Sorry, I encountered an error. Please try again or rephrase your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleCodeInsert = (code: string) => {
    if (onCodeInsert) {
      onCodeInsert(code);
      addMessage('system', 'Code inserted into editor!');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-panel">
        <div className="ai-assistant-header">
          <div className="ai-assistant-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
              <circle cx="12" cy="5" r="2"/>
              <path d="M12 7v4"/>
              <line x1="8" y1="16" x2="8" y2="16"/>
              <line x1="16" y1="16" x2="16" y2="16"/>
            </svg>
            <span>AI Assistant</span>
            {currentFile && (
              <span className="current-file">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                {currentFile.name}
              </span>
            )}
          </div>
          <button className="ai-assistant-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="ai-assistant-content">
          <div className="ai-messages">
            {messages.map((message) => (
              <div key={message.id} className={`ai-message ai-message-${message.type}`}>
                <div className="ai-message-header">
                  <div className="ai-message-avatar">
                    {message.type === 'user' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    ) : message.type === 'ai' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                        <circle cx="12" cy="5" r="2"/>
                        <path d="M12 7v4"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    )}
                  </div>
                  <div className="ai-message-info">
                    <span className="ai-message-sender">
                      {message.type === 'user' ? 'You' : message.type === 'ai' ? 'AI Assistant' : 'System'}
                    </span>
                    <span className="ai-message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
                <div className="ai-message-content">
                  <div className="ai-message-text">{message.content}</div>
                  {message.codeBlock && (
                    <div className="ai-code-block">
                      <div className="ai-code-header">
                        <span className="ai-code-language">{message.language}</span>
                        <button 
                          className="ai-code-insert"
                          onClick={() => handleCodeInsert(message.codeBlock!)}
                          title="Insert code into editor"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                          Insert
                        </button>
                      </div>
                      <pre className="ai-code-content">
                        <code>{message.codeBlock}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message ai-message-ai">
                <div className="ai-message-header">
                  <div className="ai-message-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                      <circle cx="12" cy="5" r="2"/>
                      <path d="M12 7v4"/>
                    </svg>
                  </div>
                  <div className="ai-message-info">
                    <span className="ai-message-sender">AI Assistant</span>
                  </div>
                </div>
                <div className="ai-message-content">
                  <div className="ai-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-suggestions">
            {contextualSuggestions.length > 0 && (
              <div className="contextual-suggestions">
                <div className="suggestions-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11H1l8-8 8 8"/>
                    <path d="M9 11v10"/>
                  </svg>
                  Smart Suggestions
                </div>
                {contextualSuggestions.map((suggestion, index) => (
                  <button
                    key={`contextual-${index}`}
                    className="ai-suggestion contextual"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            <div className="general-suggestions">
              <div className="suggestions-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                  <circle cx="12" cy="5" r="2"/>
                  <path d="M12 7v4"/>
                </svg>
                Quick Actions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="ai-suggestion"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-input-area">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your code, or request code generation..."
              className="ai-input"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="ai-send-button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;