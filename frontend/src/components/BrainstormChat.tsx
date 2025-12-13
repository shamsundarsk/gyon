import React, { useState, useRef, useEffect } from 'react';
import { BrainIcon, XIcon, ClipboardIcon, SendIcon, RobotIcon, UserIcon, ServerIcon, RefreshIcon } from './Icons';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  sender?: string;
}

interface BrainstormChatProps {
  roomCode: string;
  onClose: () => void;
}

interface ShareableLink {
  url: string;
  code: string;
}

export const BrainstormChat: React.FC<BrainstormChatProps> = ({ roomCode, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [shareableLink, setShareableLink] = useState<ShareableLink | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate shareable link
    const baseUrl = window.location.origin;
    setShareableLink({
      url: `${baseUrl}/brainstorm/${roomCode}`,
      code: roomCode
    });

    // Load existing messages when component mounts
    loadMessages();

    // Set up polling for new messages every 3 seconds
    const pollInterval = setInterval(() => {
      loadMessages(true); // Skip if sending
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [roomCode]);

  const loadMessages = async (skipIfSending = false) => {
    // Skip loading if we're currently sending a message to avoid conflicts
    if (skipIfSending && isTyping) return;

    try {
      const response = await fetch(`/api/brainstorm/${roomCode}/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convert timestamp strings back to Date objects
          const messagesWithDates = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          // Only update if we have different number of messages or if not currently typing
          setMessages(prevMessages => {
            if (prevMessages.length !== messagesWithDates.length || !isTyping) {
              return messagesWithDates;
            }
            return prevMessages;
          });
        }
      } else {
        console.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageContent = inputMessage;
    setInputMessage('');

    // Add user message immediately to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      sender: 'You'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch(`/api/brainstorm/${roomCode}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          sender: 'You'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Reload all messages to get the latest state
          await loadMessages();
        }
      } else {
        // Handle error - add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: 'Failed to send message. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to UI
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Network error. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Convert markdown-like formatting to HTML with proper styling
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: inherit; font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: inherit; font-style: italic;">$1</em>')
      .replace(/`(.*?)`/g, '<code style="background-color: rgba(15, 23, 42, 0.8); padding: 2px 6px; border-radius: 4px; color: #2ecc70; font-family: monospace; font-size: 0.9em;">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre style="background-color: rgba(15, 23, 42, 0.8); padding: 12px; border-radius: 8px; color: #2ecc70; font-family: monospace; font-size: 0.9em; overflow-x: auto; white-space: pre-wrap;">$1</pre>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="fixed inset-0 bg-deep-bg z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#05110a] border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <BrainIcon size={24} color="#2ecc70" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Brainstorm Room {roomCode}</h2>
            <p className="text-slate-400 text-sm">AI-Powered Collaboration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadMessages()}
            className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg text-sm hover:bg-accent/20 transition-all flex items-center gap-2"
            title="Refresh messages"
          >
            <RefreshIcon size={14} />
            Sync
          </button>
          <button
            onClick={() => {
              const shareText = shareableLink 
                ? `Join my brainstorm session: ${shareableLink.url} or use code: ${roomCode}`
                : `Join my brainstorm session with code: ${roomCode}`;
              navigator.clipboard.writeText(shareText);
            }}
            className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm hover:bg-primary/20 transition-all flex items-center gap-2"
          >
            <ClipboardIcon size={14} />
            Share Room
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-primary text-[#010804] ml-auto'
                  : message.type === 'ai'
                  ? 'bg-[#05110a] border border-white/10 text-white'
                  : 'bg-accent/10 border border-accent/20 text-white'
              }`}
            >
              {message.type !== 'user' && (
                <div className="flex items-center gap-2 mb-2 text-sm opacity-80">
                  {message.type === 'ai' ? (
                    <>
                      <RobotIcon size={16} />
                      <span>AI Assistant</span>
                    </>
                  ) : (
                    <>
                      <ServerIcon size={16} />
                      <span>System</span>
                    </>
                  )}
                </div>
              )}
              <div
                className={`prose prose-sm max-w-none ${
                  message.type === 'user' 
                    ? 'text-[#010804]' 
                    : message.type === 'ai'
                    ? 'brainstorm-message text-white'
                    : 'text-white'
                }`}
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
              <div className={`text-xs opacity-60 mt-2 ${
                message.type === 'user' 
                  ? 'text-[#010804]' 
                  : 'text-white'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#05110a] border border-white/10 rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center gap-2 mb-2 text-sm opacity-80">
                <RobotIcon size={16} />
                <span>AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span className="text-slate-400 text-sm ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#05110a] border-t border-white/10 p-4">
        <div className="flex gap-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about project planning, API integration, team collaboration..."
            className="flex-1 bg-[#0b1f15] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-6 py-3 bg-primary hover:bg-[#25a25a] disabled:bg-slate-600 disabled:cursor-not-allowed text-[#010804] font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center gap-2"
          >
            <SendIcon size={16} />
            Send
          </button>
        </div>
        <div className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line • AI responses powered by Gyon Intelligence
        </div>
      </div>
    </div>
  );
};