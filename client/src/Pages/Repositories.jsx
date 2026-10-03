import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { FiSearch, FiStar, FiClock, FiTarget } from "../Component/icons.js";

export default function Repositories() {
  const [q, setQ] = useState("");
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/api/repos${q ? `?q=${encodeURIComponent(q)}` : ""}`)
        .then(setRepos)
        .catch((err) => setError(err.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-neutral-800 gap-4">
        <div className="w-full md:w-2/3">
          <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-widest">Repositories</h1>
          <p className="text-neutral-500 font-mono text-sm">Browse public repositories</p>
        </div>
        <div className="w-full md:w-1/3 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search repositories..." className="w-full bg-black border border-neutral-700 rounded-sm py-2 pl-10 pr-4 text-white focus:outline-none focus:border-white font-mono text-sm" />
        </div>
      </div>
      {error && <p className="text-red-400 font-mono text-sm mb-4">{error}</p>}
      <div className="space-y-4">
        {repos.map((repo) => (
          <Link key={repo.id} to={`/repos/${repo.full_name}`} className="p-6 border border-neutral-800 bg-neutral-950 hover:border-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 mb-2 flex items-center gap-2 tracking-wide">
                <FiTarget className="text-neutral-500" /> {repo.full_name}
              </h3>
              <p className="text-neutral-400 text-sm">{repo.description || "No description"}</p>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono text-neutral-500 uppercase">
              <span>{repo.language || "n/a"}</span>
              <span className="flex items-center gap-1 text-white"><FiStar className="text-neutral-400" /> {repo.star_count}</span>
              <span className="flex items-center gap-1"><FiClock /> {String(repo.updated_at).slice(0, 10)}</span>
            </div>
          </Link>
        ))}
        {repos.length === 0 && <p className="text-neutral-500">No public repositories yet.</p>}
      </div>
    </div>
  );
}
