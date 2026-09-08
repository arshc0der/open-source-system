import React, { useState } from 'react';
/* 
===========================================================================
THEME & DESIGN SYSTEM (Save this for future prompts)
===========================================================================
Project Name: OSS (Version Control Platform)
Vibe/Theme: Metaverse / Modern Universe
Color Palette:
  - Backgrounds: Deep Space Black (bg-black), Void Gray (bg-gray-950)
  - Gradients: bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-black to-black
  - Primary Accent: Neon Green (text-green-400, bg-green-500)
  - Borders/Glows: border-green-500/50, shadow-[0_0_15px_rgba(34,197,94,0.3)]
  - Text: Starlight White (text-gray-100), Muted Gray (text-gray-400)
Core UI Elements: Glassmorphism panels (bg-gray-900/50 backdrop-blur-md)
Brand Identity: Geometric Wolf Mascot (Neon Green Glow)
Key Platform Entities: Repositories, Branches, Commits, Issues, Collaborators

Icons Required: 
Please run: `npm install react-icons`
(This code uses FiGithub, FiTerminal, FiUser, FiLock, FiBox, FiGitBranch, FiGitCommit from 'react-icons/fi')
===========================================================================
*/

// IMPORT ICONS HERE ONCE INSTALLED:
// import { FiTerminal, FiUser, FiLock, FiBox, FiGitBranch, FiGitCommit } from 'react-icons/fi';

// Fallback Mock Icons (so the code runs before you install the pack)
const IconFallback = () => <div className="w-5 h-5 bg-green-500/20 rounded-full border border-green-500 flex items-center justify-center text-[10px] text-green-400">❖</div>;

export default function OSSWebPlatform() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'login', 'register'

  const navigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans overflow-x-hidden selection:bg-green-500 selection:text-black">
      {/* Metaverse/Universe Background Glow */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80 pointer-events-none" />
      
      {/* Navigation */}
      <nav className="relative z-10 border-b border-gray-800 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('home')}>
              {/* Geometric Wolf Mascot Placeholder */}
              <div className="w-8 h-8 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-green-500 blur-[10px] opacity-40 rounded-full"></div>
                <div className="relative z-10 text-green-400">
                  {/* Replace with actual SVG Wolf Logo */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 22 12 17 22 22 12 2"></polygon>
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-black tracking-widest text-white drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                OSS
              </span>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <button onClick={() => navigate('home')} className="hover:text-green-400 text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors">Universe</button>
                <button className="hover:text-green-400 text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors">Repositories</button>
                <button className="hover:text-green-400 text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors">Collaborators</button>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => navigate('login')}
                className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('register')}
                className="bg-transparent border border-green-500 text-green-400 hover:bg-green-500 hover:text-black px-4 py-2 rounded-md text-sm font-medium transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]"
              >
                Join Network
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex flex-col justify-center min-h-[calc(100vh-64px)]">
        {currentPage === 'home' && <HomePage navigate={navigate} />}
        {currentPage === 'login' && <LoginPage navigate={navigate} />}
        {currentPage === 'register' && <RegisterPage navigate={navigate} />}
      </main>
    </div>
  );
}

// --- HOME PAGE COMPONENT ---
function HomePage({ navigate }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="inline-block mb-4 px-4 py-1 rounded-full border border-green-500/30 bg-green-900/20 text-green-400 text-sm font-mono backdrop-blur-sm">
        > _ System Online: Welcome to the Metaverse
      </div>
      <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
        Code in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-700">Digital Void</span>
      </h1>
      <p className="mt-4 max-w-2xl text-xl text-gray-400 mx-auto mb-10">
        The ultimate distributed version control system. Sync your repositories, branches, and commits across the modern universe.
      </p>
      <div className="flex justify-center gap-6">
        <button 
          onClick={() => navigate('register')}
          className="bg-green-500 text-black px-8 py-4 rounded-md text-lg font-bold transition-all hover:bg-green-400 shadow-[0_0_25px_rgba(34,197,94,0.4)] flex items-center gap-2"
        >
          <IconFallback /> Initialize Repository
        </button>
        <button 
          className="bg-gray-900 border border-gray-700 text-white px-8 py-4 rounded-md text-lg font-bold hover:border-green-500/50 hover:bg-gray-800 transition-all"
        >
          Explore Network
        </button>
      </div>

      {/* Feature Grid */}
      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {[
          { title: "Immutable Commits", desc: "Every line of code is etched into the digital universe securely." },
          { title: "Infinite Branches", desc: "Fork reality. Test your ideas in isolated parallel branches." },
          { title: "Global Collaborators", desc: "Merge pull requests with developers lightyears away." }
        ].map((feature, i) => (
          <div key={i} className="p-6 rounded-xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm hover:border-green-500/50 transition-colors group">
            <div className="w-12 h-12 mb-4 rounded-lg bg-black border border-green-900 flex items-center justify-center group-hover:border-green-400 transition-colors">
              <IconFallback />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- LOGIN PAGE COMPONENT ---
function LoginPage({ navigate }) {
  return (
    <div className="max-w-md w-full mx-auto p-8 rounded-2xl border border-gray-800 bg-gray-950/80 backdrop-blur-xl shadow-2xl relative">
      {/* Neon glow effect behind form */}
      <div className="absolute -inset-1 bg-green-500/20 rounded-2xl blur-xl -z-10"></div>
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-white">Access Portal</h2>
        <p className="text-gray-400 mt-2 text-sm">Enter your credentials to sync with the network</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">Developer ID</label>
          <div className="relative">
            <input 
              type="text" 
              className="w-full bg-black border border-gray-700 rounded-md py-3 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-600"
              placeholder="username or email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">Encryption Key</label>
          <div className="relative">
            <input 
              type="password" 
              className="w-full bg-black border border-gray-700 rounded-md py-3 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-600"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-green-500 text-black font-bold py-3 px-4 rounded-md hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          Authenticate
        </button>
      </form>

      <p className="mt-6 text-center text-gray-400 text-sm">
        New to the network? <button onClick={() => navigate('register')} className="text-green-400 hover:text-green-300 hover:underline">Register here</button>
      </p>
    </div>
  );
}

// --- REGISTER PAGE COMPONENT ---
function RegisterPage({ navigate }) {
  return (
    <div className="max-w-md w-full mx-auto p-8 rounded-2xl border border-gray-800 bg-gray-950/80 backdrop-blur-xl shadow-2xl relative mt-8">
      {/* Neon glow effect behind form */}
      <div className="absolute -inset-1 bg-green-500/20 rounded-2xl blur-xl -z-10"></div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-white">Join OSS</h2>
        <p className="text-gray-400 mt-2 text-sm">Create your entity in the master branch</p>
      </div>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">Username</label>
          <input 
            type="text" 
            className="w-full bg-black border border-gray-700 rounded-md py-3 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            placeholder="hacker_wolf"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">Email Address</label>
          <input 
            type="email" 
            className="w-full bg-black border border-gray-700 rounded-md py-3 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            placeholder="dev@universe.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">Password</label>
          <input 
            type="password" 
            className="w-full bg-black border border-gray-700 rounded-md py-3 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="w-full border border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black font-bold py-3 px-4 rounded-md transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] mt-4">
          Generate Identity
        </button>
      </form>

      <p className="mt-6 text-center text-gray-400 text-sm">
        Already registered? <button onClick={() => navigate('login')} className="text-green-400 hover:text-green-300 hover:underline">Return to Login</button>
      </p>
    </div>
  );
}