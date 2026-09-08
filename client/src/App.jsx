import React, { useState } from 'react';
import { 
  FiTerminal, FiGitBranch, FiGitCommit, FiBox, 
  FiUser, FiStar, FiClock, FiFolder, FiFile, 
  FiSearch, FiActivity, FiLogOut, FiSettings, FiTarget
} from 'react-icons/fi';

/* 
===========================================================================
THEME & DESIGN SYSTEM (V3: Aerospace / SpaceX x GitHub)
===========================================================================
Project Name: OSS (Orbital Source System)
Vibe: Aerospace Engineering, Command Center, SpaceX, Interplanetary
Color Palette:
  - Backgrounds: Deep Space Black (bg-black), Titanium Gray (bg-neutral-900)
  - Accents: Thruster Blue (blue-500, sky-400), Stark White (white)
  - Text: High-contrast White (text-white), Telemetry Gray (text-neutral-400)
Core UI Elements: 
  - Minimalist, sharp edges (rounded-sm or rounded-none)
  - Uppercase typography for headings with wide tracking
  - High-contrast borders, no overly blurry neon glows
  - Data-heavy, functional "Command Center" layout
===========================================================================
*/

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeRepo, setActiveRepo] = useState(null);

  const navigate = (page, repoData = null) => {
    setCurrentPage(page);
    if (repoData) setActiveRepo(repoData);
    window.scrollTo(0, 0);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    navigate('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('home');
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans overflow-x-hidden selection:bg-white selection:text-black">
      {/* Subtle Earth/Horizon Glow - No neon, just a stark aerospace atmospheric light */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black opacity-100 pointer-events-none" />
      
      {/* Navigation - Industrial & Minimal */}
      <nav className="relative z-10 border-b border-neutral-800 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('home')}>
              {/* Sleek Orbit/Rocket Logo */}
              <div className="relative z-10 text-white group-hover:text-blue-400 transition-colors">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2L21 5.5a2.12 2.12 0 0 0-3-3L4.5 16.5z"></path>
                  <path d="M12 15l3 3"></path>
                  <path d="M6.7 17.3L5 22l4.7-1.7"></path>
                  <path d="M9 12l3 3"></path>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-[0.2em] text-white">
                OSS
              </span>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8 text-xs font-bold tracking-widest uppercase">
                <button onClick={() => navigate('home')} className="hover:text-white text-neutral-400 pb-1 border-b-2 border-transparent hover:border-white transition-all">Mission</button>
                <button onClick={() => navigate('repositories')} className="hover:text-white text-neutral-400 pb-1 border-b-2 border-transparent hover:border-white transition-all">Databanks</button>
                {isLoggedIn && (
                  <button onClick={() => navigate('dashboard')} className="hover:text-white text-neutral-400 pb-1 border-b-2 border-transparent hover:border-white transition-all">Telemetry</button>
                )}
              </div>
            </div>

            <div className="flex gap-4 items-center">
              {!isLoggedIn ? (
                <>
                  <button onClick={() => navigate('login')} className="text-neutral-300 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors">
                    Login
                  </button>
                  <button onClick={() => navigate('register')} className="bg-white text-black hover:bg-neutral-200 px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all">
                    Initiate
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('dashboard')}>
                    <div className="w-8 h-8 rounded-sm bg-neutral-800 border border-neutral-600 flex items-center justify-center group-hover:border-white transition-colors">
                      <FiUser className="text-white w-4 h-4" />
                    </div>
                  </div>
                  <button onClick={handleLogout} className="text-neutral-500 hover:text-white transition-colors">
                    <FiLogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Routing Area */}
      <main className="relative z-10 flex-grow min-h-[calc(100vh-64px)] pb-20">
        {currentPage === 'home' && <HomePage navigate={navigate} />}
        {currentPage === 'login' && <LoginPage onLogin={handleLogin} navigate={navigate} />}
        {currentPage === 'register' && <RegisterPage onLogin={handleLogin} navigate={navigate} />}
        {currentPage === 'dashboard' && <DashboardPage navigate={navigate} />}
        {currentPage === 'repositories' && <RepositoriesPage navigate={navigate} />}
        {currentPage === 'repo_detail' && <RepoDetailPage repo={activeRepo} navigate={navigate} />}
      </main>
    </div>
  );
}

// ==========================================
// 1. HOME PAGE
// ==========================================
function HomePage({ navigate }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center flex flex-col justify-center items-center">
      <div className="inline-block mb-8 px-4 py-1.5 border border-neutral-700 bg-neutral-900/50 text-neutral-300 text-xs font-mono uppercase tracking-widest">
        Status: Nominal | Orbital Sync Active
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight uppercase text-white">
        Interplanetary <br className="hidden md:block"/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">
          Version Control
        </span>
      </h1>
      
      <p className="mt-6 max-w-2xl text-lg text-neutral-400 mx-auto mb-12 font-light">
        Deploy your code across the solar system. Secure repositories, parallel branch trajectories, and zero-latency interplanetary syncing for elite engineering teams.
      </p>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
        <button 
          onClick={() => navigate('register')}
          className="flex-1 bg-white text-black px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-widest transition-all hover:bg-neutral-200 flex items-center justify-center gap-2"
        >
          <FiTerminal className="w-4 h-4" /> Initiate Sequence
        </button>
        <button 
          onClick={() => navigate('repositories')}
          className="flex-1 bg-transparent border border-neutral-600 text-white px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:border-white hover:bg-neutral-900 transition-all flex items-center justify-center gap-2"
        >
          <FiTarget className="w-4 h-4" /> View Telemetry
        </button>
      </div>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full border-t border-neutral-800 pt-16">
        {[
          { title: "Immutable Payloads", desc: "Cryptographically verified commits, secured against solar radiation and data degradation.", icon: <FiGitCommit className="w-5 h-5 text-white" /> },
          { title: "Parallel Trajectories", desc: "Isolate experimental features in independent branches before orbital rendezvous (merge).", icon: <FiGitBranch className="w-5 h-5 text-white" /> },
          { title: "Deep Space Network", desc: "Collaborate seamlessly across distributed nodes from Earth to Mars outposts.", icon: <FiActivity className="w-5 h-5 text-white" /> }
        ].map((feature, i) => (
          <div key={i} className="p-8 border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-900 transition-colors group">
            <div className="w-10 h-10 mb-6 bg-neutral-900 border border-neutral-700 flex items-center justify-center group-hover:border-white transition-colors">
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold mb-3 text-white uppercase tracking-wider">{feature.title}</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 2. LOGIN PAGE
// ==========================================
function LoginPage({ onLogin, navigate }) {
  return (
    <div className="max-w-md w-full mx-auto mt-24 p-8 border border-neutral-800 bg-neutral-950 relative">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Command Auth</h2>
        <p className="text-neutral-500 mt-2 text-xs font-mono uppercase">Secure connection required</p>
      </div>

      <form className="space-y-6" onSubmit={onLogin}>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Operator ID</label>
          <input type="text" required className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm placeholder-neutral-700" placeholder="commander_01" />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Access Code</label>
          <input type="password" required className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm placeholder-neutral-700" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full bg-white text-black font-bold py-3 px-4 rounded-sm hover:bg-neutral-200 transition-all uppercase tracking-widest text-sm mt-4">
          Verify Identity
        </button>
      </form>
      <p className="mt-8 text-center text-neutral-500 text-xs uppercase tracking-wider">
        No clearance? <button onClick={() => navigate('register')} className="text-white hover:text-blue-400 hover:underline">Request Access</button>
      </p>
    </div>
  );
}

// ==========================================
// 3. REGISTER PAGE
// ==========================================
function RegisterPage({ onLogin, navigate }) {
  return (
    <div className="max-w-md w-full mx-auto mt-24 p-8 border border-neutral-800 bg-neutral-950 relative">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Establish Link</h2>
        <p className="text-neutral-500 mt-2 text-xs font-mono uppercase">Register new operator node</p>
      </div>

      <form className="space-y-5" onSubmit={onLogin}>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Operator ID</label>
          <input type="text" required className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white transition-all font-mono text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Transmission Email</label>
          <input type="email" required className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white transition-all font-mono text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Access Code (Password)</label>
          <input type="password" required className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white transition-all font-mono text-sm" />
        </div>
        <button type="submit" className="w-full bg-transparent border border-white text-white font-bold py-3 px-4 rounded-sm hover:bg-white hover:text-black transition-all uppercase tracking-widest text-sm mt-6">
          Initialize Operator
        </button>
      </form>
      <p className="mt-8 text-center text-neutral-500 text-xs uppercase tracking-wider">
        Active connection? <button onClick={() => navigate('login')} className="text-white hover:text-blue-400 hover:underline">Return to Auth</button>
      </p>
    </div>
  );
}

// ==========================================
// 4. DASHBOARD PAGE
// ==========================================
function DashboardPage({ navigate }) {
  // Generate aerospace-style contribution data (white/blue variations instead of green)
  const contributionBoxes = Array.from({ length: 140 }).map((_, i) => {
    const intensity = Math.random();
    let bgClass = "bg-neutral-900";
    if (intensity > 0.8) bgClass = "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]";
    else if (intensity > 0.6) bgClass = "bg-blue-300";
    else if (intensity > 0.4) bgClass = "bg-blue-900";
    return <div key={i} className={`w-3 h-3 rounded-sm ${bgClass}`}></div>;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Profile */}
        <div className="w-full md:w-1/4 space-y-6">
          <div className="p-6 border border-neutral-800 bg-neutral-950 relative overflow-hidden">
            <div className="w-24 h-24 bg-neutral-900 border border-neutral-700 mb-6 flex items-center justify-center">
              <FiUser className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Cmdr_Wolf</h2>
            <p className="text-neutral-500 text-xs font-mono mb-6">ID: 899-AX-ORBITAL</p>
            
            <button className="w-full py-2 bg-transparent hover:bg-white hover:text-black border border-neutral-700 hover:border-white text-white text-xs uppercase font-bold tracking-widest transition-all">
              Update Profile
            </button>
            
            <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-col gap-3 text-sm text-neutral-400 font-mono">
              <div className="flex justify-between"><span>FOLLOWERS</span> <strong className="text-white">142</strong></div>
              <div className="flex justify-between"><span>FOLLOWING</span> <strong className="text-white">24</strong></div>
              <div className="flex justify-between"><span>CLEARANCE</span> <strong className="text-blue-400">LEVEL 4</strong></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full md:w-3/4 space-y-8">
          
          {/* Contribution Graph - Telemetry Style */}
          <div className="p-6 border border-neutral-800 bg-neutral-950">
            <h3 className="text-xs font-bold text-neutral-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <FiActivity className="text-blue-400" /> Commits / Telemetry (792 Updates)
            </h3>
            <div className="flex flex-wrap gap-1.5 p-4 bg-black border border-neutral-900">
              {contributionBoxes}
            </div>
          </div>

          {/* Recent Repos */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Active Databanks</h3>
              <button 
                onClick={() => navigate('repositories')}
                className="text-white px-3 py-1 text-xs font-bold uppercase hover:bg-neutral-800 transition-colors border border-neutral-700"
              >
                + Initialize New
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "nav-system-core", desc: "Orbital mechanics calculation engine.", lang: "Rust", color: "text-orange-500" },
                { name: "life-support-ui", desc: "Frontend interface for O2 monitors.", lang: "TypeScript", color: "text-blue-500" },
                { name: "thruster-telemetry", desc: "Real-time data ingestion for Raptor engines.", lang: "Go", color: "text-cyan-400" },
                { name: "docking-protocol", desc: "Automated ISS docking sequence.", lang: "Python", color: "text-yellow-400" }
              ].map((repo, i) => (
                <div key={i} onClick={() => navigate('repo_detail', repo)} className="p-5 border border-neutral-800 bg-neutral-950 hover:border-white cursor-pointer transition-all group">
                  <h4 className="text-white font-bold text-md mb-2 group-hover:text-blue-400 flex items-center gap-2">
                    <FiBox className="text-neutral-500" /> {repo.name}
                  </h4>
                  <p className="text-neutral-400 text-xs mb-6 h-8">{repo.desc}</p>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase">
                    <span className={`w-2 h-2 rounded-full bg-current ${repo.color}`}></span>
                    <span className="text-neutral-500">{repo.lang}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. EXPLORE / REPOSITORIES PAGE
// ==========================================
function RepositoriesPage({ navigate }) {
  const allRepos = [
    { name: "starship-flight-software", desc: "Main control loop for orbital class vehicles.", lang: "C++", color: "text-blue-500", stars: "12.4k", updated: "2h ago" },
    { name: "falcon-recovery", desc: "Grid fin and automated drone ship landing logic.", lang: "TypeScript", color: "text-blue-400", stars: "8.1k", updated: "5h ago" },
    { name: "mission-control-ui", desc: "React-based command center interface.", lang: "JavaScript", color: "text-yellow-400", stars: "5.2k", updated: "1d ago" },
    { name: "orbital-mechanics-lib", desc: "Mathematical models for trajectory planning.", lang: "Rust", color: "text-orange-500", stars: "4.9k", updated: "2d ago" },
    { name: "sat-mesh-network", desc: "Routing protocols for low earth orbit constellations.", lang: "Go", color: "text-cyan-400", stars: "3.1k", updated: "1w ago" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-neutral-800 gap-4">
        <div className="w-full md:w-2/3">
          <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-widest">Global Databanks</h1>
          <p className="text-neutral-500 font-mono text-sm">Querying active repositories across the network...</p>
        </div>
        <div className="w-full md:w-1/3 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search payload..." 
            className="w-full bg-black border border-neutral-700 rounded-sm py-2 pl-10 pr-4 text-white focus:outline-none focus:border-white transition-all font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {allRepos.map((repo, i) => (
          <div key={i} onClick={() => navigate('repo_detail', repo)} className="p-6 border border-neutral-800 bg-neutral-950 hover:border-white cursor-pointer transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 mb-2 flex items-center gap-2 tracking-wide">
                <FiTarget className="text-neutral-500" /> {repo.name}
              </h3>
              <p className="text-neutral-400 text-sm">{repo.desc}</p>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono text-neutral-500 uppercase">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full bg-current ${repo.color}`}></span>
                {repo.lang}
              </div>
              <div className="flex items-center gap-1 text-white">
                <FiStar className="text-neutral-400" /> {repo.stars}
              </div>
              <div className="flex items-center gap-1">
                <FiClock /> {repo.updated}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 6. REPOSITORY DETAIL PAGE
// ==========================================
function RepoDetailPage({ repo, navigate }) {
  // Fallback if accessed directly without state
  const currentRepo = repo || { name: "orbital-mechanics-lib", desc: "Mathematical models for trajectory planning.", stars: "4.9k" };

  const mockFiles = [
    { name: "src", type: "folder", msg: "Refactor trajectory calculations", date: "2 days ago" },
    { name: "docs", type: "folder", msg: "Update API specifications", date: "5 days ago" },
    { name: ".gitignore", type: "file", msg: "Initial payload", date: "1 month ago" },
    { name: "Cargo.toml", type: "file", msg: "Bump dependency versions", date: "2 weeks ago" },
    { name: "README.md", type: "file", msg: "Add setup instructions", date: "1 day ago" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Repo Header */}
      <div className="mb-8 border-b border-neutral-800 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-wider">
            <div className="w-10 h-10 border border-neutral-600 bg-neutral-900 flex items-center justify-center text-white">
              <FiTarget />
            </div>
            CMDR_WOLF / <span className="text-blue-400">{currentRepo.name}</span>
          </h1>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-transparent border border-neutral-700 hover:border-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors">
              <FiStar /> Star <span className="bg-neutral-800 px-2 py-0.5 ml-1">{currentRepo.stars}</span>
            </button>
            <button className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2 rounded-sm text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors">
              <FiGitBranch /> Detach (Fork)
            </button>
          </div>
        </div>
        <p className="text-neutral-400 text-md font-light">{currentRepo.desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Code View */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Bar (Branch & Commits) */}
          <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 p-4">
            <div className="flex items-center gap-2">
              <button className="bg-neutral-900 text-white px-3 py-1.5 rounded-sm text-xs font-mono uppercase flex items-center gap-2 border border-neutral-700 hover:border-white transition-colors">
                <FiGitBranch /> master_node
              </button>
            </div>
            <div className="text-xs text-neutral-400 flex items-center gap-2 font-mono uppercase">
              <FiGitCommit className="text-white" /> 
              <span className="text-white font-bold">142</span> Payloads Logged
            </div>
          </div>

          {/* File Explorer - GitHub Structure, Aerospace Style */}
          <div className="border border-neutral-800 bg-black overflow-hidden -mt-6">
            <div className="bg-neutral-950 p-3 border-b border-neutral-800 flex items-center gap-3 text-sm font-mono text-neutral-300">
              <div className="w-5 h-5 bg-white flex items-center justify-center">
                <FiUser className="w-3 h-3 text-black" />
              </div>
              <span className="font-bold text-white">Cmdr_Wolf</span>
              <span className="text-neutral-500 truncate ml-2">Merge branch 'hotfix/engine-valve'</span>
            </div>
            
            <ul className="divide-y divide-neutral-900">
              {mockFiles.map((file, i) => (
                <li key={i} className="flex items-center justify-between p-3 hover:bg-neutral-900 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 w-1/3">
                    {file.type === 'folder' ? 
                      <FiFolder className="text-blue-400 group-hover:text-blue-300" /> : 
                      <FiFile className="text-neutral-600 group-hover:text-white" />
                    }
                    <span className="text-neutral-300 group-hover:text-white font-mono text-sm transition-colors">{file.name}</span>
                  </div>
                  <div className="w-1/2 text-neutral-500 text-sm truncate font-mono">{file.msg}</div>
                  <div className="w-1/6 text-right text-neutral-600 text-xs font-mono uppercase">{file.date}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* README Render */}
          <div className="border border-neutral-800 bg-black overflow-hidden mt-8">
            <div className="bg-neutral-950 p-3 border-b border-neutral-800 font-mono text-xs uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <FiFile /> README.md
            </div>
            <div className="p-8 prose prose-invert max-w-none">
              <h1 className="text-white border-b border-neutral-800 pb-4 uppercase tracking-widest text-2xl">{currentRepo.name}</h1>
              <p className="text-neutral-400 leading-relaxed">{currentRepo.desc}</p>
              <h2 className="text-white mt-8 uppercase tracking-wider text-sm font-bold border-l-2 border-blue-500 pl-3">Deployment Protocol</h2>
              <pre className="bg-neutral-950 border border-neutral-800 rounded-sm p-4 text-neutral-300 font-mono text-sm mt-4">
                <code>$ init_sequence pull --latest<br/>$ run diagnostics --all</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          <div className="border-b border-neutral-800 pb-6">
            <h3 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-widest">About Data</h3>
            <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
              Core logic for orbital maneuvers and atmospheric entry calculations. Restricted access class.
            </p>
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2 font-mono">
              <FiStar /> <strong className="text-white">{currentRepo.stars}</strong> stars
            </div>
            <div className="flex items-center gap-2 text-neutral-400 text-sm font-mono">
              <FiActivity /> <strong className="text-white">24</strong> observing
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-widest">Stack Composition</h3>
            <div className="w-full h-1.5 bg-neutral-900 flex overflow-hidden mb-4 rounded-full">
              <div className="h-full bg-orange-500" style={{width: '60%'}}></div>
              <div className="h-full bg-blue-500" style={{width: '30%'}}></div>
              <div className="h-full bg-yellow-400" style={{width: '10%'}}></div>
            </div>
            <ul className="text-xs font-mono text-neutral-400 space-y-2 uppercase">
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Rust (60%)</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-500"></span> TypeScript (30%)</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Python (10%)</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}