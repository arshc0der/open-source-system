import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { FiUser, FiActivity, FiBox } from "../Component/icons.js";

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/me")
      .then(setData)
      .catch((err) => {
        setError(err.message);
        if (err.status === 401) navigate("/login");
      });
  }, [navigate]);

  if (error) return <p className="p-10 text-red-400 font-mono">{error}</p>;
  if (!data) return <p className="p-10 text-neutral-500 font-mono">Loading...</p>;

  const profile = data.user || user;
  const repos = data.repositories || [];
  const boxes = Array.from({ length: 140 }).map((_, i) => {
    const intensity = (i * 7) % 10 / 10;
    let bgClass = "bg-neutral-900";
    if (intensity > 0.8) bgClass = "bg-white";
    else if (intensity > 0.6) bgClass = "bg-blue-300";
    else if (intensity > 0.4) bgClass = "bg-blue-900";
    return <div key={i} className={`w-3 h-3 rounded-sm ${bgClass}`} />;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/4 space-y-6">
          <div className="p-6 border border-neutral-800 bg-neutral-950">
            <div className="w-24 h-24 bg-neutral-900 border border-neutral-700 mb-6 flex items-center justify-center">
              <FiUser className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{profile.display_name || profile.username}</h2>
            <p className="text-neutral-500 text-xs font-mono mb-6">@{profile.username}</p>
            <p className="text-neutral-400 text-sm mb-6">{profile.bio || "No bio set."}</p>
            <div className="pt-6 border-t border-neutral-800 flex flex-col gap-3 text-sm text-neutral-400 font-mono">
              <div className="flex justify-between"><span>FOLLOWERS</span> <strong className="text-white">{data.followers}</strong></div>
              <div className="flex justify-between"><span>FOLLOWING</span> <strong className="text-white">{data.following}</strong></div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-3/4 space-y-8">
          <div className="p-6 border border-neutral-800 bg-neutral-950">
            <h3 className="text-xs font-bold text-neutral-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <FiActivity className="text-blue-400" /> Activity heat map
            </h3>
            <div className="flex flex-wrap gap-1.5 p-4 bg-black border border-neutral-900">{boxes}</div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Your repositories</h3>
              <Link to="/new" className="text-white px-3 py-1 text-xs font-bold uppercase hover:bg-neutral-800 border border-neutral-700">
                + New repository
              </Link>
            </div>
            {repos.length === 0 && <p className="text-neutral-500 text-sm">No repositories yet. Create one to begin.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.map((repo) => (
                <Link key={repo.id} to={`/repos/${repo.full_name}`} className="p-5 border border-neutral-800 bg-neutral-950 hover:border-white transition-all group block">
                  <h4 className="text-white font-bold text-md mb-2 group-hover:text-blue-400 flex items-center gap-2">
                    <FiBox className="text-neutral-500" /> {repo.name}
                  </h4>
                  <p className="text-neutral-400 text-xs mb-6 h-8">{repo.description || "No description"}</p>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-neutral-500">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {repo.language || "n/a"} · {repo.star_count} stars
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
