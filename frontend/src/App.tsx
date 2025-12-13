import { useState, useEffect } from 'react';
import './App.css';
import {
  LoadingSpinner,
  MashupResults,
  CodeEditorPage,
} from './components';
import { FAQ } from './components/FAQ';
import { AIChatbot } from './components/AIChatbot';
import { GenerationPage } from './components/GenerationPage';
import { LandingPage } from './components/LandingPage';
import { BrainstormModal } from './components/BrainstormModal';
import { BrainstormChat } from './components/BrainstormChat';
import { OllamaStatus } from './components/OllamaStatus';
import { ThemeToggle } from './components/ThemeToggle';
import { UserPreferencesPanel } from './components/UserPreferencesPanel';
import { OnboardingTour, useOnboarding } from './components/OnboardingTour';
import { DiceIcon, AlertIcon, RobotIcon, BrainIcon, UserIcon, HelpCircleIcon } from './components/Icons';
import { useMashup } from './context';
import { performanceOptimizer } from './services/PerformanceOptimizer';
import { userPreferencesService } from './services/UserPreferencesService';

function App() {
  const { 
    mashupData, 
    isLoading, 
    error, 
    generate, 
    regenerate, 
    download,
    clearError,
    isDownloading,
    downloadSuccess,
    generateCustom
  } = useMashup();
  
  const { hasSeenOnboarding, markOnboardingComplete } = useOnboarding();
  
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!hasSeenOnboarding);
  const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);
  const [brainstormRoomCode, setBrainstormRoomCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'landing' | 'generate' | 'results' | 'editor'>('landing');

  // Initialize performance optimization
  useEffect(() => {
    performanceOptimizer.optimizeBundleLoading();
    performanceOptimizer.optimizeAssets();
    performanceOptimizer.implementCaching();

    return () => {
      performanceOptimizer.cleanup();
    };
  }, []);

  // Apply user preferences on mount
  useEffect(() => {
    const preferences = userPreferencesService.getPreferences();
    document.documentElement.setAttribute('data-theme', userPreferencesService.getEffectiveTheme());
    
    // Apply font preferences
    document.documentElement.style.setProperty('--editor-font-family', preferences.fontFamily);
    document.documentElement.style.setProperty('--editor-font-size', `${preferences.fontSize}px`);
  }, []);

  // Handle URL-based room joining
  useEffect(() => {
    const path = window.location.pathname;
    const brainstormMatch = path.match(/^\/brainstorm\/([A-Z0-9]{6})$/);
    
    if (brainstormMatch) {
      const roomCode = brainstormMatch[1];
      setBrainstormRoomCode(roomCode);
      // Update URL to clean path
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleGenerate = (problemStatement?: string) => {
    generate(problemStatement);
    setCurrentPage('results');
  };

  const handleCustomGenerate = (apiIds: string[]) => {
    generateCustom(apiIds);
    setCurrentPage('results');
  };

  const handleStartJourney = () => {
    setCurrentPage('generate');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
  };

  const handleOpenEditor = () => {
    setCurrentPage('editor');
  };

  const handleBackFromEditor = () => {
    setCurrentPage('results');
  };

  const handleDownload = () => {
    download();
  };

  const handleRegenerate = () => {
    regenerate();
  };

  const handleOnboardingComplete = () => {
    markOnboardingComplete();
    setIsOnboardingOpen(false);
  };

  const handleShowOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  const handleOpenBrainstorm = () => {
    setIsBrainstormModalOpen(true);
  };

  const handleCloseBrainstormModal = () => {
    setIsBrainstormModalOpen(false);
  };

  const handleCreateBrainstormChat = (roomCode: string) => {
    setBrainstormRoomCode(roomCode);
    setIsBrainstormModalOpen(false);
  };

  const handleJoinBrainstormChat = (roomCode: string) => {
    setBrainstormRoomCode(roomCode);
    setIsBrainstormModalOpen(false);
  };

  const handleCloseBrainstormChat = () => {
    setBrainstormRoomCode(null);
  };

  // Show code editor page
  if (currentPage === 'editor') {
    return (
      <div className="app">
        <CodeEditorPage 
          onBack={handleBackFromEditor} 
          mashupData={mashupData}
        />
      </div>
    );
  }

  // Show results page if data exists and we're on results page
  if (mashupData && !isLoading && currentPage === 'results') {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section" onClick={handleBackToLanding} style={{ cursor: 'pointer' }}>
              <div className="logo-icon">
                🐢
              </div>
              <h1 className="logo-title">Gyon</h1>
            </div>
            <div className="header-nav">
              <button 
                className="brainstorm-btn"
                onClick={handleOpenBrainstorm}
                title="Enhanced Brainstorm"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(46, 204, 112, 0.1)',
                  border: '1px solid rgba(46, 204, 112, 0.3)',
                  borderRadius: '8px',
                  color: '#2ecc70',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(46, 204, 112, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(46, 204, 112, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <BrainIcon size={16} />
                Brainstorm
              </button>
              <button 
                className="preferences-btn"
                onClick={() => setIsPreferencesOpen(true)}
                title="User Preferences"
              >
                <UserIcon size={18} />
              </button>
              <button 
                className="help-btn"
                onClick={handleShowOnboarding}
                title="Show Help Tour"
              >
                <HelpCircleIcon size={18} />
              </button>
              <button 
                className="faq-btn"
                onClick={() => setIsChatbotOpen(true)}
              >
                <RobotIcon size={18} />
                AI Assistant
              </button>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px 0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
            {error && (
              <div className="alert alert-error animate-slideDown">
                <span className="alert-icon">
                  <AlertIcon size={20} />
                </span>
                <div className="alert-content">
                  <p className="alert-message">{error}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={clearError}>
                  Dismiss
                </button>
              </div>
            )}

            <MashupResults
              mashupData={mashupData}
              onDownload={handleDownload}
              onRegenerate={handleRegenerate}
              onCustomGenerate={handleCustomGenerate}
              onOpenEditor={handleOpenEditor}
              onBack={handleBackToLanding}
              isDownloading={isDownloading}
              downloadSuccess={downloadSuccess}
            />
          </div>
        </main>

        <AIChatbot 
          isOpen={isChatbotOpen} 
          onClose={() => setIsChatbotOpen(false)} 
        />

        <FAQ 
          isOpen={isFAQOpen} 
          onClose={() => setIsFAQOpen(false)} 
        />

        <UserPreferencesPanel
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
        />

        <OnboardingTour
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onComplete={handleOnboardingComplete}
        />

        <BrainstormModal
          isOpen={isBrainstormModalOpen}
          onClose={handleCloseBrainstormModal}
          onCreateChat={handleCreateBrainstormChat}
          onJoinChat={handleJoinBrainstormChat}
        />

        {brainstormRoomCode && (
          <BrainstormChat
            roomCode={brainstormRoomCode}
            onClose={handleCloseBrainstormChat}
          />
        )}

        {!isChatbotOpen && (
          <button 
            className="faq-fab"
            onClick={() => setIsChatbotOpen(true)}
            title="AI Assistant"
          >
            <RobotIcon size={24} color="white" />
          </button>
        )}
      </div>
    );
  }

  // Show generation page
  if (currentPage === 'generate') {
    return (
      <div className="app">
        <GenerationPage 
          onGenerate={handleGenerate}
          onBack={handleBackToLanding}
          isLoading={isLoading}
        />
        
        <AIChatbot 
          isOpen={isChatbotOpen} 
          onClose={() => setIsChatbotOpen(false)} 
        />

        <FAQ 
          isOpen={isFAQOpen} 
          onClose={() => setIsFAQOpen(false)} 
        />

        <UserPreferencesPanel
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
        />

        <OnboardingTour
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onComplete={handleOnboardingComplete}
        />

        {!isChatbotOpen && (
          <button 
            className="faq-fab"
            onClick={() => setIsChatbotOpen(true)}
            title="AI Assistant"
          >
            <RobotIcon size={24} color="white" />
          </button>
        )}
      </div>
    );
  }

  // Show landing page
  return (
    <div className="app">
      {/* Error Alert */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-3 rounded-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AlertIcon size={20} />
            <span>{error}</span>
            <button onClick={clearError} className="ml-4 text-red-400 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-deep-bg/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      <LandingPage onStartBuilding={handleStartJourney} onOpenBrainstorm={handleOpenBrainstorm} />

      <BrainstormModal
        isOpen={isBrainstormModalOpen}
        onClose={handleCloseBrainstormModal}
        onCreateChat={handleCreateBrainstormChat}
        onJoinChat={handleJoinBrainstormChat}
      />

      {brainstormRoomCode && (
        <BrainstormChat
          roomCode={brainstormRoomCode}
          onClose={handleCloseBrainstormChat}
        />
      )}
    </div>
  );
}

export default App;