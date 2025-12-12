import { useState } from 'react';
import './App.css';
import {
  LoadingSpinner,
  MashupResults,
  CodeEditorPage,
} from './components';
import { FAQ } from './components/FAQ';
import { AIChatbot } from './components/AIChatbot';
import { GenerationPage } from './components/GenerationPage';
import { OllamaStatus } from './components/OllamaStatus';
import { DiceIcon, LightbulbIcon, CompassIcon, RocketIcon, AlertIcon, RobotIcon } from './components/Icons';
import { useMashup } from './context';

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
  
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'landing' | 'generate' | 'results' | 'editor'>('landing');

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

  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
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
            <div className="logo-section">
              <div className="logo-icon">
                <DiceIcon size={32} color="#2ecc70" />
              </div>
              <h1 className="logo-title">API Roulette</h1>
            </div>
            <div className="header-nav">
              <OllamaStatus />
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
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <DiceIcon size={40} color="var(--primary-500)" />
            </div>
            <h1 className="logo-title">API Roulette</h1>
          </div>
          <div className="header-nav">
            <nav className="nav-links">
              <a href="#features" className="nav-link" onClick={scrollToFeatures}>Features</a>
              <a href="#how-it-works" className="nav-link" onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>How It Works</a>
              <a href="#contact" className="nav-link" onClick={(e) => {
                e.preventDefault();
                document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
              }}>Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error animate-slideDown" style={{ maxWidth: '1400px', margin: '0 auto 32px', padding: '0 40px' }}>
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

      {/* Hero Section */}
      {!isLoading && (
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Build Your Next Great Idea</h1>
            <p className="hero-description">
              Discover the perfect API combinations for your hackathon project. Whether you have a specific idea or want to explore random possibilities, we'll help you create something amazing.
            </p>
            <button 
              className="btn btn-primary btn-hero"
              onClick={handleStartJourney}
            >
              <RocketIcon size={24} />
              Start the Hackathon Journey
            </button>
          </div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 40px' }}>
          <LoadingSpinner />
        </div>
      )}

      {/* Features Section */}
      {!isLoading && (
        <section id="features" className="features-section">
          <div className="features-header">
            <h2 className="features-title">How It Works</h2>
            <p className="features-description">
              Discover endless possibilities by instantly generating unique combinations of APIs for your next project. Our platform simplifies the brainstorming process, helping you find the perfect stack to build innovative applications.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <LightbulbIcon size={32} />
              </div>
              <h3 className="feature-title">Instant Inspiration</h3>
              <p className="feature-description">
                Get a random combination of three powerful APIs to kickstart your creativity.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <CompassIcon size={32} />
              </div>
              <h3 className="feature-title">Discover New APIs</h3>
              <p className="feature-description">
                Explore a curated list of popular and niche APIs you might not have known about.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <RocketIcon size={32} />
              </div>
              <h3 className="feature-title">Build Faster</h3>
              <p className="feature-description">
                Focus on building, not on endless brainstorming. Get your project off the ground in minutes.
              </p>
            </div>
          </div>
        </section>
      )}



      {/* Footer */}
      <footer id="footer" className="app-footer">
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <DiceIcon size={32} color="#2ecc70" />
                <span className="footer-brand-name">API Roulette</span>
              </div>
              <p className="footer-tagline">
                Spark innovation by combining powerful APIs into unique hackathon projects.
              </p>
            </div>
            
            <div className="footer-links-grid">
              <div className="footer-column">
                <h4 className="footer-column-title">Product</h4>
                <a href="#features" className="footer-link">Features</a>
                <a href="#how-it-works" className="footer-link">How It Works</a>
                <a href="#" className="footer-link">API Registry</a>
              </div>
              
              <div className="footer-column">
                <h4 className="footer-column-title">Resources</h4>
                <a href="#" className="footer-link">Documentation</a>
                <a href="#" className="footer-link">API Guide</a>
                <a href="#" className="footer-link">Blog</a>
              </div>
              
              <div className="footer-column">
                <h4 className="footer-column-title">Contact</h4>
                <a href="mailto:contact@porygon.dev" className="footer-link">contact@porygon.dev</a>
                <a href="#" className="footer-link">Support</a>
                <a href="#" className="footer-link">Feedback</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-legal">
              <p className="footer-copyright">
                © 2024 Porygon. All rights reserved.
              </p>
              <p className="footer-creator">
                Created by <span className="creator-name">Porygon</span>
              </p>
            </div>
            <div className="footer-legal-links">
              <a href="#privacy" className="footer-legal-link">Privacy Policy</a>
              <span className="footer-separator">•</span>
              <a href="#terms" className="footer-legal-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
