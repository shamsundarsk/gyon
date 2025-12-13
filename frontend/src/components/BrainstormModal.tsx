import React, { useState } from 'react';
import { BrainIcon, RocketIcon, LinkIcon, XIcon, SparklesIcon, RefreshIcon, LockIcon, UsersIcon, LightbulbIcon, CompassIcon, ServerIcon } from './Icons';

interface BrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (roomCode: string) => void;
  onJoinChat: (roomCode: string) => void;
}

export const BrainstormModal: React.FC<BrainstormModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
  onJoinChat
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChat = async () => {
    if (generatedCode) {
      // If we already have a code, join the room
      onCreateChat(generatedCode);
      return;
    }

    // Create a new room via API
    setIsCreating(true);
    try {
      const response = await fetch('/api/brainstorm/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGeneratedCode(data.room.code);
        } else {
          console.error('Failed to create room:', data.error);
        }
      } else {
        console.error('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinChat = async () => {
    if (!roomCode.trim() || roomCode.length !== 6) return;

    const code = roomCode.trim().toUpperCase();
    
    // Validate room exists before joining
    try {
      const response = await fetch('/api/brainstorm/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onJoinChat(code);
        } else {
          alert('Room not found. Please check the code and try again.');
        }
      } else {
        alert('Failed to join room. Please try again.');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#05110a] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrainIcon size={32} color="#2ecc70" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Enhanced Brainstorm</h2>
                <p className="text-slate-400 text-sm">AI-powered collaborative platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RocketIcon size={16} />
            Create Chat
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LinkIcon size={16} />
            Join Chat
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'create' ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <BrainIcon size={32} color="#2ecc70" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Start a New Brainstorm Session</h3>
                <p className="text-slate-400 text-sm">
                  Create a collaborative space for your team to brainstorm ideas with AI assistance
                </p>
              </div>

              {generatedCode && (
                <div className="bg-[#0b1f15] border border-primary/30 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-xs mb-2">Your Room Code:</p>
                  <div className="text-2xl font-mono font-bold text-primary tracking-wider">
                    {generatedCode}
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Share this code with your team</p>
                </div>
              )}

              <button
                onClick={handleCreateChat}
                disabled={isCreating}
                className="w-full bg-primary hover:bg-[#25a25a] disabled:bg-primary/50 disabled:cursor-not-allowed text-[#010804] font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none shadow-[0_0_20px_rgba(46,204,112,0.3)]"
              >
                {isCreating ? 'Creating Room...' : generatedCode ? 'Enter Brainstorm Room' : 'Generate Room Code'}
              </button>

              <div className="text-xs text-slate-500 text-center space-y-1">
                <p className="flex items-center justify-center gap-2">
                  <SparklesIcon size={12} color="#2ecc70" />
                  AI-powered project guidance
                </p>
                <p className="flex items-center justify-center gap-2">
                  <RefreshIcon size={12} color="#2ecc70" />
                  Real-time collaboration
                </p>
                <p className="flex items-center justify-center gap-2">
                  <LockIcon size={12} color="#2ecc70" />
                  Secure room-based sharing
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20">
                  <UsersIcon size={32} color="#3b82f6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Join Existing Session</h3>
                <p className="text-slate-400 text-sm">
                  Enter a room code to join an ongoing brainstorm session
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code (e.g., ABC123)"
                    className="w-full bg-[#0b1f15] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-center tracking-wider"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleJoinChat}
                  disabled={roomCode.length !== 6}
                  className="w-full bg-accent hover:bg-accent/80 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none"
                >
                  Join Brainstorm Session
                </button>
              </div>

              <div className="text-xs text-slate-500 text-center space-y-1">
                <p className="flex items-center justify-center gap-2">
                  <LightbulbIcon size={12} color="#3b82f6" />
                  Collaborative idea generation
                </p>
                <p className="flex items-center justify-center gap-2">
                  <CompassIcon size={12} color="#3b82f6" />
                  AI-assisted decision making
                </p>
                <p className="flex items-center justify-center gap-2">
                  <ServerIcon size={12} color="#3b82f6" />
                  Integrated API discovery
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};