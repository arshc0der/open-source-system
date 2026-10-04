import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { FiSearch, FiStar, FiClock, FiTarget, FiGitBranch } from "../Component/icons.js";

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
    <div className="page-shell">
      <div className="mb-6 flex flex-col gap-4 border-b border-[#30363d] pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-[#848d97]">Discover</p>
          <h1 className="text-2xl font-semibold text-[#e6edf3]">Public repositories</h1>
        </div>
        <div className="relative w-full md:w-[360px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search repositories..."
              className="w-full bg-black border border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
        </div>
      </div>

      {error && <p className="text-red-400 font-mono text-sm mb-4">{error}</p>}

      <div className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
        {repos.map((repo) => (
          <Link key={repo.id} to={`/repos/${repo.full_name}`} className="block border-b border-[#212830] px-4 py-4 last:border-0 hover:bg-[#161b22] sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[#58a6ff]">
                  <FiTarget className="text-neutral-400" />
                  <h2 className="truncate text-base font-semibold">{repo.full_name}</h2>
                </div>
                <p className="mt-1 text-sm text-[#848d97]">{repo.description || "No description provided."}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-500 uppercase">
                {repo.language && <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />{repo.language}</span>}
                <span className="inline-flex items-center gap-1"><FiGitBranch className="text-neutral-400" /> {repo.default_branch || "main"}</span>
                <span className="inline-flex items-center gap-1"><FiStar className="text-neutral-400" /> {repo.star_count}</span>
                <span className="inline-flex items-center gap-1"><FiClock /> {String(repo.updated_at).slice(0, 10)}</span>
              </div>
            </div>
          </Link>
        ))}

        {repos.length === 0 && !error && <p className="p-8 text-center text-sm text-neutral-500">No public repositories yet.</p>}
      </div>
    </div>
  );
}
