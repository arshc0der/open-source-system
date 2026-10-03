import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { FiStar, FiGitBranch, FiGitCommit, FiFolder, FiFile, FiUser } from "../Component/icons.js";

export default function RepoDetail({ user }) {
  const { owner, name } = useParams();
  const [repo, setRepo] = useState(null);
  const [tab, setTab] = useState("code");
  const [issues, setIssues] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [issueTitle, setIssueTitle] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const data = await api(`/api/repos/${owner}/${name}`);
    setRepo(data);
    const [issueRows, pullRows] = await Promise.all([
      api(`/api/repos/${data.id}/issues`),
      api(`/api/repos/${data.id}/pulls`),
    ]);
    setIssues(issueRows);
    setPulls(pullRows);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [owner, name]);

  if (error) return <p className="p-10 text-red-400 font-mono">{error}</p>;
  if (!repo) return <p className="p-10 text-neutral-500 font-mono">Loading...</p>;

  const star = async () => {
    if (!user) return;
    await api(`/api/repos/${repo.id}/star`, { method: "POST" });
    await load();
  };

  const fork = async () => {
    if (!user) return;
    const forked = await api(`/api/repos/${repo.id}/fork`, { method: "POST" });
    window.location.href = `/repos/${forked.full_name}`;
  };

  const createIssue = async (e) => {
    e.preventDefault();
    await api(`/api/repos/${repo.id}/issues`, { method: "POST", body: { title: issueTitle } });
    setIssueTitle("");
    await load();
  };

  const createPr = async (e) => {
    e.preventDefault();
    await api(`/api/repos/${repo.id}/pulls`, { method: "POST", body: { title: prTitle, source_branch: "feature", target_branch: "main" } });
    setPrTitle("");
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b border-neutral-800 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-wider">
            {repo.full_name}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={star} className="flex items-center gap-2 border border-neutral-700 hover:border-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest">
              <FiStar /> Star <span className="bg-neutral-800 px-2 py-0.5 ml-1">{repo.star_count}</span>
            </button>
            <button onClick={fork} className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2 rounded-sm text-xs uppercase tracking-widest">
              <FiGitBranch /> Fork
            </button>
          </div>
        </div>
        <p className="text-neutral-400">{repo.description}</p>
        <div className="flex gap-4 mt-6 text-xs uppercase tracking-widest">
          {["code", "issues", "pulls"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-2 border-b-2 ${tab === t ? "text-white border-white" : "text-neutral-500 border-transparent"}`}>
              {t} {t === "issues" ? `(${issues.length})` : t === "pulls" ? `(${pulls.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {tab === "code" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 p-4">
              <span className="text-xs font-mono uppercase flex items-center gap-2 border border-neutral-700 px-3 py-1.5">
                <FiGitBranch /> {repo.default_branch || "main"}
              </span>
              <span className="text-xs text-neutral-400 font-mono uppercase flex items-center gap-2">
                <FiGitCommit className="text-white" /> {repo.commit_count} commits
              </span>
            </div>
            <div className="border border-neutral-800 bg-black overflow-hidden -mt-6">
              <div className="bg-neutral-950 p-3 border-b border-neutral-800 flex items-center gap-3 text-sm font-mono text-neutral-300">
                <div className="w-5 h-5 bg-white flex items-center justify-center">
                  <FiUser className="w-3 h-3 text-black" />
                </div>
                <span className="font-bold text-white">{repo.owner_username}</span>
                <span className="text-neutral-500 truncate">{repo.commits?.[0]?.commit_message || "Initial commit"}</span>
              </div>
              <ul className="divide-y divide-neutral-900">
                {(repo.files || []).map((file) => (
                  <li key={file.id} className="flex items-center justify-between p-3 hover:bg-neutral-900">
                    <div className="flex items-center gap-3 w-1/3">
                      {file.is_directory ? <FiFolder className="text-blue-400" /> : <FiFile className="text-neutral-600" />}
                      <span className="font-mono text-sm">{file.path}</span>
                    </div>
                    <div className="w-1/2 text-neutral-500 text-sm truncate font-mono">{file.commit_message}</div>
                    <div className="w-1/6 text-right text-neutral-600 text-xs font-mono">{String(file.updated_at).slice(0, 10)}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-neutral-800 bg-black p-8">
              <h2 className="text-white border-b border-neutral-800 pb-4 uppercase tracking-widest text-2xl">{repo.name}</h2>
              <p className="text-neutral-400 mt-4">{repo.description || "No README content yet."}</p>
            </div>
          </div>
          <div className="space-y-8">
            <div className="border-b border-neutral-800 pb-6">
              <h3 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-widest">About</h3>
              <p className="text-neutral-300 text-sm mb-4">{repo.description || "No description"}</p>
              <p className="text-xs font-mono text-neutral-500 uppercase">{repo.language || "No language set"}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "issues" && (
        <div className="space-y-4">
          {user && (
            <form onSubmit={createIssue} className="flex gap-3">
              <input required value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} placeholder="Issue title" className="flex-1 bg-black border border-neutral-700 py-2 px-3 text-white font-mono text-sm" />
              <button className="bg-white text-black px-4 text-xs font-bold uppercase">Open issue</button>
            </form>
          )}
          {issues.map((issue) => (
            <div key={issue.id} className="border border-neutral-800 p-4">
              <div className="flex justify-between">
                <h3 className="text-white font-bold">#{issue.issue_number} {issue.title}</h3>
                <span className="text-xs uppercase font-mono text-blue-400">{issue.state}</span>
              </div>
              <p className="text-neutral-500 text-xs mt-2">opened by {issue.author_username}</p>
            </div>
          ))}
          {issues.length === 0 && <p className="text-neutral-500">No issues.</p>}
        </div>
      )}

      {tab === "pulls" && (
        <div className="space-y-4">
          {user && (
            <form onSubmit={createPr} className="flex gap-3">
              <input required value={prTitle} onChange={(e) => setPrTitle(e.target.value)} placeholder="Pull request title" className="flex-1 bg-black border border-neutral-700 py-2 px-3 text-white font-mono text-sm" />
              <button className="bg-white text-black px-4 text-xs font-bold uppercase">Open PR</button>
            </form>
          )}
          {pulls.map((pr) => (
            <div key={pr.id} className="border border-neutral-800 p-4">
              <div className="flex justify-between">
                <h3 className="text-white font-bold">#{pr.pull_number} {pr.title}</h3>
                <span className="text-xs uppercase font-mono text-blue-400">{pr.state}</span>
              </div>
              <p className="text-neutral-500 text-xs mt-2">{pr.source_branch} → {pr.target_branch} · {pr.author_username}</p>
            </div>
          ))}
          {pulls.length === 0 && <p className="text-neutral-500">No pull requests.</p>}
        </div>
      )}
    </div>
  );
}
