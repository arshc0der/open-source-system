import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { FiActivity, FiBox, FiGitBranch, FiPlus, FiSearch, FiStar, FiUsers } from "../Component/icons.js";

export default function Home() {
  const [repositories, setRepositories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/repos")
      .then((rows) => { if (active) setRepositories(rows.slice(0, 6)); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 text-[#e6edf3] sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
      <aside className="space-y-5">
        <section className="rounded-md border border-[#30363d] bg-[#0d1117] p-4">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Start here</h2><FiActivity className="text-[#848d97]" /></div>
          <nav className="space-y-1" aria-label="Quick links">
            <Link to="/explore" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[#c9d1d9] hover:bg-[#161b22]"><FiSearch className="text-[#848d97]" /> Explore repositories</Link>
            <Link to="/organizations" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[#c9d1d9] hover:bg-[#161b22]"><FiUsers className="text-[#848d97]" /> Organizations</Link>
            <Link to="/new" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[#c9d1d9] hover:bg-[#161b22]"><FiPlus className="text-[#848d97]" /> Create repository</Link>
          </nav>
        </section>
        <section className="rounded-md border border-[#30363d] bg-[#0d1117] p-4">
          <p className="text-xs font-semibold uppercase text-[#848d97]">Build together</p>
          <p className="mt-2 text-sm leading-6 text-[#c9d1d9]">Track project files, discuss issues, and review changes with your team.</p>
          <Link to="/register" className="mt-4 inline-flex text-sm font-medium text-[#58a6ff] hover:underline">Create your account →</Link>
        </section>
      </aside>

      <main className="min-w-0">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#30363d] pb-4">
          <div><p className="text-xs font-medium uppercase text-[#848d97]">Developer workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-normal">Explore open source</h1><p className="mt-1 text-sm text-[#848d97]">Discover projects and see what the community is building.</p></div>
          <Link to="/explore" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#3d444d] bg-[#212830] px-3 text-sm font-medium hover:bg-[#30363d]"><FiSearch /> Browse all</Link>
        </header>

        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Popular repositories</h2><Link to="/explore" className="text-sm text-[#58a6ff] hover:underline">View all</Link></div>
        {error && <p role="alert" className="mb-4 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#ff7b72]">{error}</p>}
        <div className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
          {repositories.map((repo) => <Link key={repo.id} to={`/repos/${repo.full_name}`} className="block border-b border-[#212830] px-4 py-4 last:border-0 hover:bg-[#161b22] sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex min-w-0 items-center gap-2 font-semibold text-[#58a6ff]"><FiBox className="shrink-0 text-[#848d97]" /><span className="truncate">{repo.full_name}</span></h3><span className="inline-flex items-center gap-1 text-xs text-[#848d97]"><FiStar /> {repo.star_count || 0}</span></div>
            <p className="mt-2 text-sm text-[#848d97]">{repo.description || "No description provided."}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#848d97]">{repo.language && <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#f1e05a]" />{repo.language}</span>}<span className="inline-flex items-center gap-1"><FiGitBranch /> {repo.default_branch || "main"}</span><span>Updated {String(repo.updated_at).slice(0, 10)}</span>{repo.topics?.map((topic) => <span key={topic} className="rounded-full bg-[#1f6feb]/15 px-2 py-0.5 text-[#79c0ff]">{topic}</span>)}</div>
          </Link>)}
          {!repositories.length && !error && <div className="px-5 py-12 text-center"><FiBox className="mx-auto mb-3 text-2xl text-[#848d97]" /><h3 className="font-semibold">No public repositories yet</h3><p className="mt-1 text-sm text-[#848d97]">Create the first project or check back as the community grows.</p><Link to="/new" className="mt-4 inline-flex rounded-md bg-[#238636] px-3 py-2 text-sm font-medium text-white hover:bg-[#2ea043]">Create a repository</Link></div>}
        </div>
      </main>
    </div>
  );
}
