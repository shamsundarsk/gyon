import React, { useState } from 'react';

interface LandingPageProps {
  onStartBuilding: () => void;
  onOpenBrainstorm?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartBuilding, onOpenBrainstorm }) => {
  const [selectedProject, setSelectedProject] = useState('SaaS Boilerplate (Stripe + Auth)');
  const [addons, setAddons] = useState({
    tailwind: true,
    docker: false,
    cicd: false,
    prisma: true,
  });

  const toggleAddon = (addon: keyof typeof addons) => {
    setAddons(prev => ({ ...prev, [addon]: !prev[addon] }));
  };

  return (
    <div className="font-sans antialiased overflow-x-hidden selection:bg-primary/30 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#010804]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <a className="flex items-center gap-3 group focus:outline-none rounded-lg px-2 py-1" href="#">
              <div className="relative w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl border border-primary/20 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-105">
                🐢
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">Gyon Maker</span>
                <span className="text-[10px] text-primary/80 font-mono tracking-widest uppercase">Scaffold Engine</span>
              </div>
            </a>
            <div className="hidden md:flex items-center space-x-1 p-1 bg-surface-dark/50 rounded-full border border-white/5">
              <a className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all" href="#features">Features</a>
              <a className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all" href="#examples">Examples</a>
              <a className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all" href="#docs">Docs</a>
              <a className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all" href="#pricing">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <a aria-label="GitHub" className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5" href="https://github.com" target="_blank">
                <span className="text-xl">🔗</span>
              </a>
              {onOpenBrainstorm && (
                <button 
                  onClick={onOpenBrainstorm}
                  className="hidden sm:flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 px-4 py-2 rounded-full text-sm font-semibold transition-all transform hover:scale-105"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Brainstorm
                </button>
              )}
              <button 
                onClick={onStartBuilding}
                className="hidden sm:flex items-center gap-2 bg-primary hover:bg-[#25a25a] text-[#010804] px-5 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(46,204,112,0.3)]"
              >
                <span className="material-symbols-outlined text-lg">⚡</span> Start Building
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-grid">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px]"></div>
          <div className="absolute top-20 right-0 w-[400px] h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-12 opacity-30"></div>
          <div className="absolute top-40 right-20 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent -rotate-6 opacity-40"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 tracking-wide">
                ⚡ V2.0: Now with Local AI
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-extrabold tracking-tight mb-6 text-white leading-[1.1]">
                Build like a <span className="text-white italic">Hare</span>.<br/>
                Solid as a <span className="text-primary">Turtle</span>.
              </h1>
              <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl border-l-2 border-primary/30 pl-6">
                Stop choosing between speed and structure. Gyon generates production-ready, full-stack scaffolding in seconds, giving you the agility to win hackathons and the architecture to scale businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onStartBuilding}
                  className="group px-8 py-4 bg-primary hover:bg-[#25a25a] text-[#010804] font-bold rounded-xl shadow-[0_0_30px_rgba(46,204,112,0.2)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  <span className="text-lg">🚀</span>Generate Project
                </button>
                <button 
                  onClick={() => window.open('https://github.com', '_blank')}
                  className="px-8 py-4 bg-surface-dark border border-white/10 hover:border-primary/50 text-white font-semibold rounded-xl transition-all hover:bg-white/5 flex items-center justify-center gap-3"
                >
                  <span className="text-lg">📂</span>View Scaffolds
                </button>
              </div>
              <div className="mt-12 flex items-center gap-6 text-sm text-slate-500 font-mono">
                <span className="flex items-center gap-2"><span className="text-primary">✅</span> Type-Safe</span>
                <span className="flex items-center gap-2"><span className="text-primary">✅</span> Dockerized</span>
                <span className="flex items-center gap-2"><span className="text-primary">✅</span> Best Practices</span>
              </div>
            </div>
            <div className="lg:w-1/2 w-full animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-blue-500/10 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative bg-[#05110a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
                  <div className="bg-[#020604] border-b border-white/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                      <i className="fa-solid fa-shield-halved text-primary"></i> gyon-engine --turbo
                    </div>
                  </div>
                  <div className="p-8 relative min-h-[300px] flex items-center justify-center">
                    <div className="relative z-10 w-full flex items-center justify-between">
                      <div className="flex flex-col gap-4">
                        <div className="w-12 h-12 bg-[#0b1f15] rounded-xl border border-white/10 flex items-center justify-center text-xl shadow-lg transform -rotate-6 animate-float" style={{animationDelay: '0s'}}>
                          💳
                        </div>
                        <div className="w-12 h-12 bg-[#0b1f15] rounded-xl border border-white/10 flex items-center justify-center text-xl shadow-lg rotate-3 animate-float" style={{animationDelay: '1s'}}>
                          🎵
                        </div>
                        <div className="w-12 h-12 bg-[#0b1f15] rounded-xl border border-white/10 flex items-center justify-center text-xl shadow-lg -rotate-3 animate-float" style={{animationDelay: '2s'}}>
                          🤖
                        </div>
                      </div>
                      <div className="flex-1 px-8 relative">
                        <div className="h-[2px] w-full bg-white/5 relative overflow-hidden rounded-full">
                          <div className="absolute inset-0 bg-primary w-1/2 animate-shimmer"></div>
                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="w-16 h-16 bg-primary/20 backdrop-blur-md rounded-full border border-primary text-primary flex items-center justify-center shadow-[0_0_30px_rgba(46,204,112,0.4)]">
                            ⚙️
                          </div>
                        </div>
                      </div>
                      <div className="w-32 bg-[#0b1f15] rounded-lg border border-primary/30 p-3 shadow-2xl relative">
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-[#010804] font-bold text-xs shadow-lg z-20">
                          ✅
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-12 bg-white/20 rounded"></div>
                          <div className="h-2 w-20 bg-white/10 rounded"></div>
                          <div className="h-2 w-16 bg-white/10 rounded"></div>
                          <div className="h-2 w-full bg-primary/20 rounded mt-2"></div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          📁
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Build Simulation */}
      <section className="py-20 bg-surface-dark border-y border-white/5 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-mono text-xs uppercase tracking-widest mb-2 block">Interactive Build Simulation</span>
            <h2 className="text-3xl font-bold text-white mb-3">Experience the Velocity</h2>
            <p className="text-slate-400">Select your stack and watch the Turtle structure form at Rabbit speed.</p>
          </div>
          <div className="bg-[#020604] rounded-2xl shadow-2xl border border-white/10 overflow-hidden grid md:grid-cols-12 min-h-[450px]">
            <div className="md:col-span-4 border-r border-white/5 bg-[#05110a] p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6 text-white font-semibold">
                🎛️ Configuration
              </div>
              <div className="space-y-6 flex-grow">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-mono uppercase">Project Type</label>
                  <div className="relative">
                    <select 
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full bg-[#0b1f15] border border-white/10 rounded-lg text-slate-300 text-sm focus:ring-primary focus:border-primary py-2.5 pl-3 pr-10 appearance-none"
                    >
                      <option>SaaS Boilerplate (Stripe + Auth)</option>
                      <option>E-Commerce (Shopify + CMS)</option>
                      <option>Internal Tool (Retool + SQL)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      ▼
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-mono uppercase">Add-ons (Click to toggle)</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => toggleAddon('tailwind')}
                      className={`px-3 py-1.5 rounded border text-xs transition ${
                        addons.tailwind 
                          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20' 
                          : 'border-white/10 bg-[#020604] text-slate-400 hover:border-white/30'
                      }`}
                    >
                      + Tailwind
                    </button>
                    <button 
                      onClick={() => toggleAddon('docker')}
                      className={`px-3 py-1.5 rounded border text-xs transition ${
                        addons.docker 
                          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20' 
                          : 'border-white/10 bg-[#020604] text-slate-400 hover:border-white/30'
                      }`}
                    >
                      + Docker
                    </button>
                    <button 
                      onClick={() => toggleAddon('cicd')}
                      className={`px-3 py-1.5 rounded border text-xs transition ${
                        addons.cicd 
                          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20' 
                          : 'border-white/10 bg-[#020604] text-slate-400 hover:border-white/30'
                      }`}
                    >
                      + CI/CD
                    </button>
                    <button 
                      onClick={() => toggleAddon('prisma')}
                      className={`px-3 py-1.5 rounded border text-xs transition ${
                        addons.prisma 
                          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20' 
                          : 'border-white/10 bg-[#020604] text-slate-400 hover:border-white/30'
                      }`}
                    >
                      + Prisma
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={onStartBuilding}
                className="w-full mt-6 bg-white text-[#010804] hover:bg-slate-200 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                ▶️ Run Build Sequence
              </button>
            </div>
            <div className="md:col-span-8 bg-[#010804] p-6 font-mono text-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-50">
                <span className="text-slate-600">🐧</span>
                <span className="text-slate-600">bash</span>
              </div>
              <div className="space-y-2 font-mono text-xs sm:text-sm">
                <div className="flex gap-2">
                  <span className="text-primary">➜</span>
                  <span className="text-blue-400">~/projects</span>
                  <span className="text-slate-400">$ gyon create saas-starter --turbo</span>
                </div>
                <div className="py-2 text-slate-500 italic">Initializing Gyon Engine v2.4...</div>
                <div className="space-y-1 pl-4 border-l border-white/10">
                  <div className="text-slate-300 flex items-center gap-3">
                    <span className="text-primary">✔</span>
                    <span>Analyzing schema requirements...</span>
                    <span className="text-slate-600 text-[10px] ml-auto">12ms</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-3">
                    <span className="text-primary">✔</span>
                    <span>Resolving npm dependencies (Rabbit Mode)</span>
                    <span className="text-slate-600 text-[10px] ml-auto">45ms</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-3">
                    <span className="text-primary">✔</span>
                    <span>Generating Type-Safe Shell (Turtle Mode)</span>
                    <span className="text-slate-600 text-[10px] ml-auto">120ms</span>
                  </div>
                  <div className="text-yellow-400 flex items-center gap-3 mt-2">
                    ⚠️
                    <span>Conflict found in Auth Strategy. Auto-resolving to NextAuth v5.</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-[#0b1f15] border border-primary/20 rounded text-slate-300">
                  <div className="flex justify-between items-center mb-2 border-b border-primary/10 pb-2">
                    <span className="font-bold text-primary">Generated Structure</span>
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded">Ready</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-blue-400">src/api/</div>
                      <div className="pl-2 text-slate-500">├── stripe.ts</div>
                      <div className="pl-2 text-slate-500">└── auth.ts</div>
                    </div>
                    <div>
                      <div className="text-purple-400">prisma/</div>
                      <div className="pl-2 text-slate-500">└── schema.prisma</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 animate-pulse text-primary font-bold">
                  <span>✨ Done in 0.42s.</span>
                  <span className="w-2 h-4 bg-primary block"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-deep-bg"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-[#05110a] border border-primary/30 mb-8 shadow-[0_0_40px_rgba(46,204,112,0.2)]">
            <span className="text-4xl">🐢</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to break the shell?</h2>
          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">Join thousands of developers building robust applications at breakneck speeds.</p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button 
              onClick={onStartBuilding}
              className="bg-primary hover:bg-[#25a25a] text-[#010804] text-lg font-bold py-4 px-12 rounded-full shadow-lg shadow-primary/20 transition transform hover:-translate-y-1"
            >
              Install Gyon CLI
            </button>
            <button 
              onClick={() => window.open('https://github.com', '_blank')}
              className="bg-transparent border border-white/20 hover:bg-white/10 text-white text-lg font-semibold py-4 px-12 rounded-full transition"
            >
              Read the Docs
            </button>
          </div>
          <div className="mt-8 font-mono text-xs text-slate-500">
            <span className="bg-[#05110a] px-3 py-1 rounded border border-white/10 text-primary">npm install -g gyon-maker</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#010804] border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-primary text-2xl">🐢</span>
                <span className="font-bold text-xl text-white">Gyon Maker</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">The scaffolding tool for the modern web. Speed of a hare, stability of a tortoise.</p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a className="hover:text-primary transition-colors" href="#">CLI</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Web Builder</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-sm uppercase tracking-wider">Community</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a className="hover:text-primary transition-colors" href="#">Discord</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">GitHub</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Twitter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-600">© 2023 Gyon Maker. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-mono text-slate-500">System Status: Nominal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};