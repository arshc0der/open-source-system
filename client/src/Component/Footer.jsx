import { Link } from "react-router-dom";
import { FiBox, FiExternalLink } from "./icons.js";

export default function Footer() {
  return (
    <footer className="border-t border-[#30363d] bg-[#0d1117] text-[#848d97]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link to="/" aria-label="Open Source System home" className="inline-flex items-center gap-2 font-medium text-[#c9d1d9] hover:text-white"><FiBox /> Open Source System</Link>
          <span>© {new Date().getFullYear()} OSS</span>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link to="/explore" className="hover:text-[#58a6ff]">Explore repositories</Link>
          <Link to="/organizations" className="hover:text-[#58a6ff]">Organizations</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[#58a6ff]">GitHub <FiExternalLink /></a>
        </nav>
      </div>
    </footer>
  );
}
