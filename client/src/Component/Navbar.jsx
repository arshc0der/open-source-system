import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiBell, FiBox, FiLogOut, FiMenu, FiPlus, FiX } from "./icons.js";

const navClass = ({ isActive }) => `inline-flex h-10 items-center border-b-2 px-1 text-sm ${isActive ? "border-[#f78166] font-semibold text-white" : "border-transparent text-[#c9d1d9] hover:text-white"}`;

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#30363d] bg-[#010409]/95 text-[#e6edf3] backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#3d444d] text-[#c9d1d9] hover:bg-[#212830] md:hidden" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
        <Link to="/" onClick={closeMenu} aria-label="Open Source System home" className="flex shrink-0 items-center gap-2 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6e7681] bg-[#161b22]"><FiBox className="text-xl" /></span>
          <span className="hidden text-sm sm:inline">Open Source System</span>
          <span className="text-sm sm:hidden">OSS</span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center gap-4 md:flex">
          <NavLink to="/explore" className={navClass}>Explore</NavLink>
          {user && <>
            <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
            <NavLink to="/organizations" className={navClass}>Organizations</NavLink>
            <NavLink to={`/profile/${user.username}`} className={navClass}>Profile</NavLink>
          </>}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {user ? <>
            <button type="button" onClick={() => navigate("/new")} title="Create a new repository" aria-label="Create a new repository" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#3d444d] px-2.5 text-sm text-[#c9d1d9] hover:bg-[#212830]"><FiPlus /><span className="hidden sm:inline">New</span></button>
            <button type="button" onClick={() => navigate("/notifications")} title="Notifications" aria-label="Notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[#c9d1d9] hover:bg-[#212830]"><FiBell /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#f78166]" /></button>
            <button type="button" onClick={() => navigate("/dashboard")} title={`Signed in as ${user.username}`} aria-label="Open your dashboard" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3d444d] bg-[#212830] text-sm font-semibold text-white hover:border-[#8b949e]">{(user.display_name || user.username || "U").charAt(0).toUpperCase()}</button>
            <button type="button" onClick={onLogout} title="Sign out" aria-label="Sign out" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#848d97] hover:bg-[#212830] hover:text-white"><FiLogOut /></button>
          </> : <>
            <Link to="/login" className="rounded-md px-3 py-2 text-sm text-[#c9d1d9] hover:text-white">Sign in</Link>
            <Link to="/register" className="rounded-md border border-[#3d444d] px-3 py-2 text-sm font-medium text-white hover:border-[#8b949e]">Sign up</Link>
          </>}
        </div>
      </nav>
      {menuOpen && <div className="border-t border-[#30363d] bg-[#0d1117] px-4 py-2 md:hidden">
        <NavLink to="/explore" onClick={closeMenu} className="block rounded-md px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#161b22]">Explore</NavLink>
        {user && <>
          <NavLink to="/dashboard" onClick={closeMenu} className="block rounded-md px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#161b22]">Dashboard</NavLink>
          <NavLink to="/organizations" onClick={closeMenu} className="block rounded-md px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#161b22]">Organizations</NavLink>
          <NavLink to={`/profile/${user.username}`} onClick={closeMenu} className="block rounded-md px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#161b22]">Profile</NavLink>
        </>}
      </div>}
    </header>
  );
}
