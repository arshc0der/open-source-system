import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiBell, FiLogOut, FiUser } from "./icons.js";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="relative z-10 border-b border-neutral-800 bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative z-10 text-white group-hover:text-blue-400 transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2L21 5.5a2.12 2.12 0 0 0-3-3L4.5 16.5z"></path>
                <path d="M12 15l3 3"></path>
                <path d="M6.7 17.3L5 22l4.7-1.7"></path>
                <path d="M9 12l3 3"></path>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-[0.2em] text-white">OSS</span>
          </Link>

          <div className="hidden md:flex items-baseline space-x-8 text-xs font-bold tracking-widest uppercase">
            <NavLink to="/" className={({ isActive }) => `${isActive ? "text-white border-white" : "text-neutral-400 border-transparent"} pb-1 border-b-2 hover:text-white hover:border-white transition-all`}>
              Home
            </NavLink>
            <NavLink to="/explore" className={({ isActive }) => `${isActive ? "text-white border-white" : "text-neutral-400 border-transparent"} pb-1 border-b-2 hover:text-white hover:border-white transition-all`}>
              Explore
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={({ isActive }) => `${isActive ? "text-white border-white" : "text-neutral-400 border-transparent"} pb-1 border-b-2 hover:text-white hover:border-white transition-all`}>
                Dashboard
              </NavLink>
            )}
          </div>

          <div className="flex gap-4 items-center">
            {!user ? (
              <>
                <Link to="/login" className="text-neutral-300 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-widest">
                  Login
                </Link>
                <Link to="/register" className="bg-white text-black hover:bg-neutral-200 px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest">
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-5">
                <button onClick={() => navigate("/notifications")} className="text-neutral-400 hover:text-white">
                  <FiBell className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/new")} className="text-neutral-400 hover:text-white text-xs uppercase tracking-widest border border-neutral-700 px-2 py-1">
                  + New
                </button>
                <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-sm bg-neutral-800 border border-neutral-600 flex items-center justify-center group-hover:border-white">
                    <FiUser className="text-white w-4 h-4" />
                  </div>
                </button>
                <button onClick={onLogout} className="text-neutral-500 hover:text-white">
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
