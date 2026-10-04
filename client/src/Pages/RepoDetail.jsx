import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { FiStar, FiGitBranch, FiGitCommit, FiFolder, FiFile, FiUser, FiBell, FiEdit2, FiSave, FiX, FiPlus, FiTrash2, FiSettings } from "../Component/icons.js";
import RepositoryWorkflows from "./RepositoryWorkflows.jsx";

const buildFileUrl = (repoId, filePath) => {
  const encoded = filePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `/api/repos/${repoId}/files/${encoded}`;
};

export default function RepoDetail({ user }) {
  const navigate = useNavigate();
  const { owner, name } = useParams();
  const [repo, setRepo] = useState(null);
  const [tab, setTab] = useState("code");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchError, setBranchError] = useState("");
  const [settingsForm, setSettingsForm] = useState({ name: "", description: "", language: "", visibility: "public" });
  const [settingsNotice, setSettingsNotice] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [issues, setIssues] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileDraft, setFileDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [commitError, setCommitError] = useState("");
  const [commitNotice, setCommitNotice] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (preferredPath = null) => {
    const data = await api(`/api/repos/${owner}/${name}`);
    if (!data?.id) throw new Error("repository not found");
    setRepo(data);
    setSelectedBranch((current) => current || data.default_branch || "main");
    setSettingsForm({ name: data.name || "", description: data.description || "", language: data.language || "", visibility: data.visibility || "public" });
    const [issueRows, pullRows] = await Promise.all([
      api(`/api/repos/${data.id}/issues`),
      api(`/api/repos/${data.id}/pulls`),
    ]);
    setIssues(issueRows);
    setPulls(pullRows);
    const currentSelection = preferredPath || selectedFile;
    const selectedEntry = data.files?.find((file) => !file.is_directory && file.path === currentSelection);
    const firstMarkdown = data.files?.find((file) => !file.is_directory && file.path.toLowerCase().endsWith(".md"));
    const fileToOpen = selectedEntry || firstMarkdown || data.files?.find((file) => !file.is_directory);
    if (fileToOpen) {
      setSelectedFile(fileToOpen.path);
      const file = await api(buildFileUrl(data.id, fileToOpen.path));
      setFileContent(file.content || "");
      if (!isEditing) setFileDraft(file.content || "");
    }
  }, [owner, name, selectedFile, isEditing]);

  useEffect(() => {
    let active = true;
    const loadInitialData = async () => {
      try {
        await load();
      } catch (err) {
        if (active) setError(err.message);
      }
    };
    void loadInitialData();
    return () => { active = false; };
  }, [load]);

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

  const toggleWatch = async () => {
    if (!user) return;
    await api(`/api/repos/${repo.id}/watch`, { method: "POST" });
    await load();
  };

  const beginEdit = () => {
    setFileDraft(fileContent);
    setCommitMessage(`Update ${selectedFile?.split("/").pop() || "file"}`);
    setCommitError("");
    setCommitNotice("");
    setIsCreatingFile(false);
    setIsEditing(true);
  };

  const beginNewFile = () => {
    setSelectedFile(null);
    setNewFilePath("");
    setFileDraft("");
    setCommitMessage("Add new file");
    setCommitError("");
    setCommitNotice("");
    setIsCreatingFile(true);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreatingFile(false);
    setFileDraft(fileContent);
    setCommitError("");
  };

  const commitFile = async (event) => {
    event.preventDefault();
    const targetPath = (isCreatingFile ? newFilePath : selectedFile || "").trim();
    if (!targetPath || !commitMessage.trim()) return;
    setIsCommitting(true);
    setCommitError("");
    setCommitNotice("");
    try {
      const encodedPath = targetPath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
      const result = await api(`/api/repos/${repo.id}/files/${encodedPath}`, {
        method: "PUT",
        body: { content: fileDraft, message: commitMessage, branch: selectedBranch || repo.default_branch || "main" },
      });
      setSelectedFile(result.path);
      setFileContent(result.content);
      setFileDraft(result.content);
      setIsEditing(false);
      setIsCreatingFile(false);
      setCommitNotice(`Committed ${result.commit.sha.slice(0, 7)} to ${result.commit.branch}`);
      await load(result.path);
    } catch (err) {
      setCommitError(err.message || "Unable to commit this file");
    } finally {
      setIsCommitting(false);
    }
  };

  const openFile = async (filePath) => {
    setSelectedFile(filePath);
    setIsEditing(false);
    setIsCreatingFile(false);
    setCommitError("");
    setCommitNotice("");
    try {
      const data = await api(buildFileUrl(repo.id, filePath));
      setFileContent(data.content || "");
      setFileDraft(data.content || "");
    } catch (err) {
      setFileContent(`Unable to read file: ${err.message}`);
    }
  };

  const createBranch = async (event) => {
    event.preventDefault();
    try {
      const branch = await api(`/api/repos/${repo.id}/branches`, {
        method: "POST",
        body: { name: newBranchName, source_branch: selectedBranch || repo.default_branch },
      });
      setNewBranchName("");
      setShowBranchForm(false);
      setBranchError("");
      setSelectedBranch(branch.name);
      await load();
    } catch (err) {
      setBranchError(err.message);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSettingsError("");
    setSettingsNotice("");
    try {
      const updated = await api(`/api/repos/${repo.id}/settings`, { method: "PATCH", body: settingsForm });
      setRepo((current) => ({ ...current, ...updated }));
      setSettingsNotice("Repository settings saved.");
      if (updated.full_name !== repo.full_name) window.location.assign(`/repos/${updated.full_name}`);
    } catch (err) {
      setSettingsError(err.message);
    }
  };

  const removeRepository = async () => {
    const confirmation = window.prompt(`Type ${repo.name} to permanently delete this repository.`);
    if (confirmation !== repo.name) return;
    try {
      await api(`/api/repos/${repo.id}`, { method: "DELETE" });
      navigate("/explore");
    } catch (err) {
      setSettingsError(err.message);
    }
  };

  const deleteFile = async (filePath) => {
    if (!window.confirm(`Delete ${filePath} from this repository? This creates a commit.`)) return;
    try {
      const encodedPath = filePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
      await api(`/api/repos/${repo.id}/files/${encodedPath}`, {
        method: "DELETE",
        body: { message: `Delete ${filePath}`, branch: selectedBranch || repo.default_branch },
      });
      setCommitNotice(`Deleted ${filePath} in a new commit.`);
      await load();
    } catch (err) {
      setCommitError(err.message);
    }
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
            <button onClick={toggleWatch} className="flex items-center gap-2 border border-neutral-700 hover:border-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest">
              <FiBell /> {repo.watching ? "Watching" : "Watch"} <span className="bg-neutral-800 px-2 py-0.5 ml-1">{repo.watcher_count}</span>
            </button>
            <button onClick={fork} className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2 rounded-sm text-xs uppercase tracking-widest">
              <FiGitBranch /> Fork
            </button>
          </div>
        </div>
        <p className="text-neutral-400">{repo.description}</p>
        <div className="flex flex-wrap gap-4 mt-6 text-xs uppercase tracking-widest">
          {["code", "issues", "pulls", "commits", ...(repo.can_write ? ["settings"] : [])].map((t) => (
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
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-mono uppercase"><FiGitBranch /><select value={selectedBranch || repo.default_branch || "main"} onChange={(event) => setSelectedBranch(event.target.value)} className="max-w-40 bg-transparent text-white outline-none">{repo.branches?.map((branch) => <option key={branch.id} value={branch.name}>{branch.name}</option>)}</select></label>
                {user && repo.can_write && <button onClick={() => setShowBranchForm((open) => !open)} className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800"><FiGitBranch /> New branch</button>}
                {user && repo.can_write && <button onClick={beginNewFile} className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800"><FiPlus /> Add file</button>}
              </div>
              <span className="text-xs text-neutral-400 font-mono uppercase flex items-center gap-2">
                <FiGitCommit className="text-white" /> {repo.commit_count} commits
              </span>
            </div>
            {showBranchForm && <form onSubmit={createBranch} className="flex flex-wrap items-end gap-2 rounded-md border border-neutral-800 bg-neutral-950 p-3"><label className="min-w-48 flex-1 text-xs text-neutral-400">Branch name<input required value={newBranchName} onChange={(event) => setNewBranchName(event.target.value)} placeholder="feature/my-change" className="mt-1.5 w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm text-white" /></label><button className="rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600">Create branch</button><button type="button" onClick={() => setShowBranchForm(false)} className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300">Cancel</button>{branchError && <p role="alert" className="basis-full text-sm text-red-400">{branchError}</p>}</form>}
            <div className="overflow-hidden rounded-md border border-neutral-800 bg-black">
              <div className="bg-neutral-950 p-3 border-b border-neutral-800 flex items-center gap-3 text-sm font-mono text-neutral-300">
                <div className="w-5 h-5 bg-white flex items-center justify-center">
                  <FiUser className="w-3 h-3 text-black" />
                </div>
                {repo.owner_username ? <Link to={`/profile/${repo.owner_username}`} className="font-bold text-blue-400 hover:underline">{repo.owner_username}</Link> : <Link to={`/organizations/${repo.owner_organization_id}`} className="font-bold text-blue-400 hover:underline">{repo.owner_organization_name}</Link>}
                <span className="text-neutral-500 truncate">{repo.commits?.[0]?.commit_message || "Initial commit"}</span>
              </div>
              <ul className="divide-y divide-neutral-900">
                {(repo.files || []).map((file) => (
                  <li key={file.id} className="flex items-center">
                    <button type="button" disabled={file.is_directory} className={`flex min-w-0 flex-1 items-center justify-between gap-3 p-3 text-left hover:bg-neutral-900 disabled:cursor-default ${selectedFile === file.path ? "bg-neutral-900" : ""}`} onClick={() => openFile(file.path)}>
                    <div className="flex items-center gap-3 w-1/3">
                      {file.is_directory ? <FiFolder className="text-blue-400" /> : <FiFile className="text-neutral-600" />}
                      <span className="font-mono text-sm">{file.path}</span>
                    </div>
                    <div className="w-1/2 text-neutral-500 text-sm truncate font-mono">{file.commit_message}</div>
                    <div className="w-1/6 text-right text-neutral-600 text-xs font-mono">{String(file.updated_at).slice(0, 10)}</div>
                    </button>
                    {user && repo.can_write && !file.is_directory && <button type="button" onClick={() => deleteFile(file.path)} title={`Delete ${file.path}`} aria-label={`Delete ${file.path}`} className="mr-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-red-950 hover:text-red-300"><FiTrash2 /></button>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-md border border-neutral-800 bg-[#0d1117]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-3">
                <div className="min-w-0"><p className="text-xs text-neutral-500">{repo.full_name}</p><h2 className="truncate font-mono text-sm text-white">{isCreatingFile ? "New file" : selectedFile || repo.name}</h2></div>
                {user && repo.can_write && !isEditing && selectedFile && <button onClick={beginEdit} className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800"><FiEdit2 /> Edit</button>}
              </div>
              {isEditing ? <form onSubmit={commitFile} className="space-y-3 p-4">
                {isCreatingFile && <label className="block text-sm font-medium text-neutral-300">File path<input required value={newFilePath} onChange={(event) => setNewFilePath(event.target.value)} placeholder="src/new-file.js" className="mt-2 w-full rounded-md border border-neutral-700 bg-black px-3 py-2 font-mono text-sm text-white focus:border-blue-500 focus:outline-none" /></label>}
                <label className="block text-sm font-medium text-neutral-300">File contents<textarea autoFocus spellCheck="false" value={fileDraft} onChange={(event) => setFileDraft(event.target.value)} className="mt-2 min-h-[360px] w-full resize-y rounded-md border border-neutral-800 bg-[#010409] p-4 font-mono text-sm leading-6 text-neutral-200 focus:border-blue-500 focus:outline-none" /></label>
                <label className="block text-sm font-medium text-neutral-300">Commit message<input required maxLength={500} value={commitMessage} onChange={(event) => setCommitMessage(event.target.value)} className="mt-2 w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Describe this change" /></label>
                {commitError && <p role="alert" className="text-sm text-red-400">{commitError}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-neutral-500">Commits to {repo.default_branch || "main"}</span><div className="flex gap-2"><button type="button" onClick={cancelEdit} className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"><FiX /> Cancel</button><button disabled={isCommitting || !commitMessage.trim() || (isCreatingFile && !newFilePath.trim())} className="inline-flex items-center gap-2 rounded-md border border-green-700 bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"><FiSave /> {isCommitting ? "Committing..." : "Commit changes"}</button></div></div>
              </form> : <>
                {commitNotice && <p role="status" className="border-b border-green-900 bg-green-950/40 px-4 py-2 text-sm text-green-300">{commitNotice}</p>}
                {commitError && <p role="alert" className="border-b border-red-900 bg-red-950/30 px-4 py-2 text-sm text-red-300">{commitError}</p>}
                <pre className="max-h-[560px] min-h-32 overflow-auto p-4 font-mono text-sm leading-6 text-neutral-200 whitespace-pre-wrap">{fileContent || "Select a file to preview its code."}</pre>
              </>}
            </div>
          </div>
          <div className="space-y-8">
            <div className="border-b border-neutral-800 pb-6">
              <h3 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-widest">About</h3>
              <p className="text-neutral-300 text-sm mb-4">{repo.description || "No description"}</p>
              <p className="text-xs font-mono text-neutral-500 uppercase">{repo.language || "No language set"}</p>
              {repo.topics?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{repo.topics.map((topic) => <span key={topic} className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs text-blue-300">{topic}</span>)}</div>}
            </div>
          </div>
        </div>
      )}

      {(tab === "issues" || tab === "pulls") && (
        <RepositoryWorkflows key={tab} repo={repo} user={user} issues={issues} pulls={pulls} onRefresh={load} initialTab={tab} />
      )}

      {tab === "commits" && <section className="overflow-hidden rounded-md border border-neutral-800 bg-[#0d1117]"><header className="border-b border-neutral-800 bg-neutral-950 px-4 py-3"><h2 className="text-sm font-semibold">Commit history <span className="ml-1 text-neutral-500">({repo.commits?.length || 0})</span></h2><p className="mt-1 text-xs text-neutral-500">Recorded commits across repository branches</p></header>{repo.commits?.length ? <ol className="divide-y divide-neutral-800">{repo.commits.map((commit) => <li key={commit.id} className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-3 px-4 py-4"><span className="relative mt-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#58a6ff] bg-[#0d1117] before:absolute before:bottom-[-26px] before:top-2 before:w-px before:bg-neutral-700 last:before:hidden" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="truncate text-sm font-semibold text-neutral-100">{commit.commit_message}</span><span className="rounded-full border border-neutral-700 px-2 py-0.5 font-mono text-[11px] text-neutral-400">{commit.sha.slice(0, 7)}</span></div><p className="mt-1 text-xs text-neutral-500">{commit.author_username ? <><Link to={`/profile/${commit.author_username}`} className="text-blue-400 hover:underline">{commit.author_username}</Link> committed {new Date(commit.committed_at).toLocaleString()}</> : `Committed ${new Date(commit.committed_at).toLocaleString()}`}</p></div></li>)}</ol> : <p className="p-8 text-center text-sm text-neutral-500">No commits yet.</p>}</section>}

      {tab === "settings" && repo.can_write && <section className="max-w-3xl overflow-hidden rounded-md border border-neutral-800 bg-[#0d1117]"><header className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-3"><FiSettings className="text-neutral-400" /><h2 className="text-sm font-semibold">Repository settings</h2></header><form onSubmit={saveSettings} className="space-y-4 p-4 sm:p-6"><label className="block text-sm font-medium text-neutral-300">Repository name<input required maxLength={255} value={settingsForm.name} onChange={(event) => setSettingsForm({ ...settingsForm, name: event.target.value })} className="mt-2 w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm text-white" /></label><label className="block text-sm font-medium text-neutral-300">Description<textarea maxLength={1000} value={settingsForm.description} onChange={(event) => setSettingsForm({ ...settingsForm, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm text-white" /></label><label className="block text-sm font-medium text-neutral-300">Primary language<input value={settingsForm.language} onChange={(event) => setSettingsForm({ ...settingsForm, language: event.target.value })} className="mt-2 w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm text-white" /></label><label className="block text-sm font-medium text-neutral-300">Visibility<select value={settingsForm.visibility} onChange={(event) => setSettingsForm({ ...settingsForm, visibility: event.target.value })} className="mt-2 w-full rounded-md border border-neutral-700 bg-black px-3 py-2 text-sm text-white"><option value="public">Public</option><option value="private">Private</option></select></label>{settingsError && <p role="alert" className="text-sm text-red-400">{settingsError}</p>}{settingsNotice && <p role="status" className="text-sm text-green-400">{settingsNotice}</p>}<div className="flex justify-end"><button className="rounded-md border border-green-700 bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600">Save repository settings</button></div></form><div className="flex flex-wrap items-center justify-between gap-3 border-t border-red-900/60 bg-red-950/10 p-4"><div><h3 className="text-sm font-semibold text-red-300">Danger zone</h3><p className="mt-1 text-xs text-neutral-400">Permanently delete this repository and its stored files.</p></div><button onClick={removeRepository} className="rounded-md border border-red-700 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-950">Delete repository</button></div></section>}
    </div>
  );
}
