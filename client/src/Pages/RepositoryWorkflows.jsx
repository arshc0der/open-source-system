import { useEffect, useState } from "react";
import { api } from "../api.js";
import {
  FiCheck,
  FiGitBranch,
  FiGitMerge,
  FiMessageCircle,
  FiPlus,
  FiTag,
  FiX,
} from "../Component/icons.js";

const inputClass = "w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder:text-[#848d97] outline-none focus:border-[#4493f8] focus:ring-2 focus:ring-[#4493f8]/25";
const buttonClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#3d444d] bg-[#212830] px-3 text-sm font-medium text-[#e6edf3] hover:bg-[#30363d] disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#3fb950] bg-[#238636] px-3 text-sm font-semibold text-white hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50";

function StateBadge({ state, pull = false }) {
  const styles = state === "open"
    ? "border-[#3fb950]/50 bg-[#238636]/15 text-[#3fb950]"
    : state === "merged"
      ? "border-[#a371f7]/50 bg-[#8957e5]/15 text-[#bc8cff]"
      : "border-[#848d97]/40 bg-[#30363d]/60 text-[#c9d1d9]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}>
      {state === "open" ? <FiCheck /> : pull && state === "merged" ? <FiGitMerge /> : <FiX />}
      {state}
    </span>
  );
}

function LabelChip({ label }) {
  const color = `#${String(label.color || "1f6feb").replace(/^#/, "")}`;
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs font-medium" style={{ color, borderColor: `${color}88`, backgroundColor: `${color}1a` }}>
      {label.name}
    </span>
  );
}

function MetaLine({ children }) {
  return <p className="mt-2 text-xs leading-5 text-[#848d97]">{children}</p>;
}

export default function RepositoryWorkflows({ repo, user, issues, pulls, onRefresh, initialTab }) {
  const section = initialTab === "pulls" ? "pulls" : "issues";
  const [collaborators, setCollaborators] = useState([]);
  const [labels, setLabels] = useState([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showPullForm, setShowPullForm] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [expandedPull, setExpandedPull] = useState(null);
  const [issueForm, setIssueForm] = useState({ title: "", body: "", assignee_ids: [], label_ids: [] });
  const [pullForm, setPullForm] = useState({ title: "", body: "", source_branch: "", target_branch: repo.default_branch || "main", issue_id: "", commit_ids: [] });
  const [newLabel, setNewLabel] = useState({ name: "", color: "#1f6feb" });
  const [commentBody, setCommentBody] = useState("");
  const [reviewForm, setReviewForm] = useState({ state: "commented", body: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadMetadata = async () => {
      try {
        const [people, repoLabels] = await Promise.all([
          api(`/api/repos/${repo.id}/collaborators`),
          api(`/api/repos/${repo.id}/labels`),
        ]);
        if (active) {
          setCollaborators(people);
          setLabels(repoLabels);
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    };
    void loadMetadata();
    return () => { active = false; };
  }, [repo.id]);

  const runAction = async (action) => {
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const createIssue = async (event) => {
    event.preventDefault();
    await runAction(async () => {
      await api(`/api/repos/${repo.id}/issues`, { method: "POST", body: issueForm });
      setIssueForm({ title: "", body: "", assignee_ids: [], label_ids: [] });
      setShowIssueForm(false);
      await onRefresh();
    });
  };

  const createLabel = async () => {
    await runAction(async () => {
      const label = await api(`/api/repos/${repo.id}/labels`, {
        method: "POST",
        body: { name: newLabel.name, color: newLabel.color },
      });
      setLabels((current) => [...current, label]);
      setIssueForm((current) => ({ ...current, label_ids: [...current.label_ids, label.id] }));
      setNewLabel({ name: "", color: "#1f6feb" });
    });
  };

  const openIssue = async (issue) => {
    await runAction(async () => {
      setExpandedIssue(expandedIssue?.id === issue.id ? null : await api(`/api/repos/${repo.id}/issues/${issue.id}`));
      setExpandedPull(null);
    });
  };

  const addIssueComment = async (event, issue) => {
    event.preventDefault();
    if (!commentBody.trim()) return;
    await runAction(async () => {
      await api(`/api/repos/${repo.id}/issues/${issue.id}/comments`, { method: "POST", body: { body: commentBody } });
      setCommentBody("");
      setExpandedIssue(await api(`/api/repos/${repo.id}/issues/${issue.id}`));
    });
  };

  const setIssueState = async (issue) => {
    await runAction(async () => {
      await api(`/api/repos/${repo.id}/issues/${issue.id}`, {
        method: "PATCH",
        body: { state: issue.state === "open" ? "closed" : "open" },
      });
      setExpandedIssue(null);
      await onRefresh();
    });
  };

  const createPull = async (event) => {
    event.preventDefault();
    await runAction(async () => {
      await api(`/api/repos/${repo.id}/pulls`, {
        method: "POST",
        body: { ...pullForm, issue_id: pullForm.issue_id || null },
      });
      setPullForm({ title: "", body: "", source_branch: "", target_branch: repo.default_branch || "main", issue_id: "", commit_ids: [] });
      setShowPullForm(false);
      await onRefresh();
    });
  };

  const openPull = async (pull) => {
    await runAction(async () => {
      setExpandedPull(expandedPull?.id === pull.id ? null : await api(`/api/repos/${repo.id}/pulls/${pull.id}`));
      setExpandedIssue(null);
    });
  };

  const updatePullState = async (pull, state) => {
    await runAction(async () => {
      await api(`/api/repos/${repo.id}/pulls/${pull.id}`, { method: "PATCH", body: { state } });
      setExpandedPull(await api(`/api/repos/${repo.id}/pulls/${pull.id}`));
      await onRefresh();
    });
  };

  const submitReview = async (event, pull) => {
    event.preventDefault();
    await runAction(async () => {
      await api(`/api/repos/${repo.id}/pulls/${pull.id}/reviews`, { method: "POST", body: reviewForm });
      setReviewForm({ state: "commented", body: "" });
      setExpandedPull(await api(`/api/repos/${repo.id}/pulls/${pull.id}`));
    });
  };

  const toggleLabelId = (value) => {
    const id = Number(value);
    setIssueForm((current) => ({
      ...current,
      label_ids: current.label_ids.includes(id)
        ? current.label_ids.filter((entry) => entry !== id)
        : [...current.label_ids, id],
    }));
  };

  const openIssues = issues.filter((issue) => issue.state === "open").length;
  const openPulls = pulls.filter((pull) => pull.state === "open").length;

  return (
    <section className="overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1117] text-[#e6edf3]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] bg-[#161b22] px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold">{section === "issues" ? `${openIssues} open · ${issues.length - openIssues} closed issues` : `${openPulls} open · ${pulls.length - openPulls} closed or merged pull requests`}</h2>
        {user && (
          <button className={primaryButtonClass} onClick={() => section === "issues" ? setShowIssueForm((value) => !value) : setShowPullForm((value) => !value)}>
            <FiPlus /> {section === "issues" ? "New issue" : "New pull request"}
          </button>
        )}
      </header>

      {error && <div role="alert" className="border-b border-[#f85149]/30 bg-[#f85149]/10 px-4 py-3 text-sm text-[#ff7b72]">{error}</div>}

      {section === "issues" && (
        <>
          {showIssueForm && user && (
            <form onSubmit={createIssue} className="border-b border-[#30363d] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">Create a new issue</h2>
                <button type="button" title="Close form" aria-label="Close form" onClick={() => setShowIssueForm(false)} className="rounded p-1 text-[#848d97] hover:bg-[#212830] hover:text-white"><FiX /></button>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-3">
                  <input className={inputClass} required maxLength={500} value={issueForm.title} onChange={(event) => setIssueForm({ ...issueForm, title: event.target.value })} placeholder="Title" aria-label="Issue title" />
                  <textarea className={`${inputClass} min-h-36 resize-y`} value={issueForm.body} onChange={(event) => setIssueForm({ ...issueForm, body: event.target.value })} placeholder="Add a description..." aria-label="Issue description" />
                </div>
                <aside className="space-y-4 rounded-md border border-[#30363d] bg-[#161b22] p-3">
                  <label className="block text-xs font-semibold text-[#c9d1d9]">Assignees
                    <select multiple value={issueForm.assignee_ids.map(String)} onChange={(event) => setIssueForm({ ...issueForm, assignee_ids: [...event.target.selectedOptions].map((option) => Number(option.value)) })} className={`${inputClass} mt-2 min-h-24`}>
                      {collaborators.map((person) => <option key={person.id} value={person.id}>{person.username}</option>)}
                    </select>
                  </label>
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-[#c9d1d9]">Labels</legend>
                    <div className="flex max-h-28 flex-wrap gap-2 overflow-auto">
                      {labels.map((label) => <label key={label.id} className="flex items-center gap-1.5 text-xs text-[#c9d1d9]"><input type="checkbox" checked={issueForm.label_ids.includes(Number(label.id))} onChange={() => toggleLabelId(label.id)} /> <LabelChip label={label} /></label>)}
                      {labels.length === 0 && <span className="text-xs text-[#848d97]">No labels yet</span>}
                    </div>
                    <div className="mt-3 flex gap-2" onClick={(event) => event.stopPropagation()}>
                      <input className={`${inputClass} min-w-0`} value={newLabel.name} onChange={(event) => setNewLabel({ ...newLabel, name: event.target.value })} placeholder="New label" aria-label="New label name" />
                      <input className="h-10 w-11 cursor-pointer rounded border border-[#3d444d] bg-[#0d1117] p-1" type="color" value={newLabel.color} onChange={(event) => setNewLabel({ ...newLabel, color: event.target.value })} aria-label="Label color" />
                      <button type="button" className={buttonClass} disabled={!newLabel.name.trim() || busy} onClick={createLabel} title="Create label" aria-label="Create label"><FiPlus /></button>
                    </div>
                  </fieldset>
                </aside>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className={buttonClass} onClick={() => setShowIssueForm(false)}>Cancel</button>
                <button className={primaryButtonClass} disabled={busy || !issueForm.title.trim()}>{busy ? "Creating..." : "Submit new issue"}</button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] px-4 py-3 text-xs text-[#848d97] sm:px-5">
            <span><strong className="text-[#e6edf3]">{openIssues} Open</strong> · {issues.length - openIssues} Closed</span>
            <span>{issues.length} issues</span>
          </div>
          {issues.length === 0 ? <div className="px-5 py-14 text-center"><FiTag className="mx-auto mb-3 text-2xl text-[#848d97]" /><h3 className="font-semibold">No issues yet</h3><p className="mt-1 text-sm text-[#848d97]">Track bugs, ideas, and tasks for this repository.</p></div> : (
            <ul className="divide-y divide-[#212830]">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <article className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><StateBadge state={issue.state} /><button onClick={() => openIssue(issue)} className="text-left font-semibold text-[#e6edf3] hover:text-[#58a6ff]">{issue.title}</button><span className="text-sm text-[#848d97]">#{issue.issue_number}</span></div>
                      <MetaLine>Opened by <span className="text-[#c9d1d9]">{issue.author_username || "a contributor"}</span> · {new Date(issue.created_at).toLocaleDateString()}</MetaLine>
                      {issue.body && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-[#c9d1d9]">{issue.body}</p>}
                      {(issue.labels?.length > 0 || issue.assignees?.length > 0) && <div className="mt-3 flex flex-wrap items-center gap-2">{issue.labels?.map((label) => <LabelChip key={label.id} label={label} />)}{issue.assignees?.map((person) => <span key={person.id} className="rounded-full bg-[#212830] px-2 py-1 text-xs text-[#c9d1d9]">@{person.username}</span>)}</div>}
                    </div>
                    <div className="flex items-start justify-start gap-2 sm:justify-end">
                      <button className={buttonClass} onClick={() => openIssue(issue)}><FiMessageCircle /> {issue.comment_count || "Discuss"}</button>
                      {user && <button className={buttonClass} disabled={busy} onClick={() => setIssueState(issue)}>{issue.state === "open" ? <><FiX /> Close</> : <><FiCheck /> Reopen</>}</button>}
                    </div>
                  </article>
                  {expandedIssue?.id === issue.id && (
                    <div className="border-t border-[#30363d] bg-[#0b0f14] px-4 py-5 sm:px-8">
                      <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wide text-[#848d97]"><FiMessageCircle /> Discussion</div>
                      <div className="space-y-3">
                        <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-4"><p className="mb-2 text-xs text-[#848d97]">@{expandedIssue.author_username || "contributor"} opened this issue</p><p className="whitespace-pre-wrap text-sm leading-6 text-[#c9d1d9]">{expandedIssue.body || "No description provided."}</p></div>
                        {expandedIssue.comments?.map((comment) => <div key={comment.id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-4"><p className="mb-2 text-xs text-[#848d97]">@{comment.author_username || "contributor"} · {new Date(comment.created_at).toLocaleString()}</p><p className="whitespace-pre-wrap text-sm leading-6 text-[#c9d1d9]">{comment.body}</p></div>)}
                      </div>
                      {user && <form onSubmit={(event) => addIssueComment(event, expandedIssue)} className="mt-4 flex flex-col gap-2 sm:flex-row"><textarea className={`${inputClass} min-h-20 resize-y`} required value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Leave a comment" aria-label="Issue comment" /><button className={`${primaryButtonClass} self-end sm:self-stretch`} disabled={busy || !commentBody.trim()}>Comment</button></form>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {section === "pulls" && (
        <>
          {showPullForm && user && (
            <form onSubmit={createPull} className="border-b border-[#30363d] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">Open a pull request</h2><button type="button" title="Close form" aria-label="Close form" onClick={() => setShowPullForm(false)} className="rounded p-1 text-[#848d97] hover:bg-[#212830] hover:text-white"><FiX /></button></div>
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
                <label className="text-xs font-semibold text-[#c9d1d9]">Compare branch<input className={`${inputClass} mt-2`} required value={pullForm.source_branch} onChange={(event) => setPullForm({ ...pullForm, source_branch: event.target.value })} placeholder="feature/my-change" /></label>
                <span className="pb-2 text-center text-xs text-[#848d97]">into</span>
                <label className="text-xs font-semibold text-[#c9d1d9]">Base branch<input className={`${inputClass} mt-2`} required value={pullForm.target_branch} onChange={(event) => setPullForm({ ...pullForm, target_branch: event.target.value })} placeholder="main" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-3"><input className={inputClass} required maxLength={500} value={pullForm.title} onChange={(event) => setPullForm({ ...pullForm, title: event.target.value })} placeholder="Add a title" aria-label="Pull request title" /><textarea className={`${inputClass} min-h-32 resize-y`} value={pullForm.body} onChange={(event) => setPullForm({ ...pullForm, body: event.target.value })} placeholder="Describe your changes..." aria-label="Pull request description" /></div>
                <label className="text-xs font-semibold text-[#c9d1d9]">Linked issue
                  <select className={`${inputClass} mt-2`} value={pullForm.issue_id} onChange={(event) => setPullForm({ ...pullForm, issue_id: event.target.value })}><option value="">No linked issue</option>{issues.map((issue) => <option key={issue.id} value={issue.id}>#{issue.issue_number} {issue.title}</option>)}</select>
                  <span className="mt-2 block font-normal leading-5 text-[#848d97]">Choose an issue this change resolves.</span>
                </label>
              </div>
              {repo.commits?.length > 0 && <fieldset className="mt-4 rounded-md border border-[#30363d] p-3"><legend className="px-1 text-xs font-semibold text-[#c9d1d9]">Included commits</legend><div className="grid gap-2 sm:grid-cols-2">{repo.commits.map((commit) => <label key={commit.id} className="flex min-w-0 items-start gap-2 rounded-md bg-[#161b22] p-2 text-xs"><input type="checkbox" checked={pullForm.commit_ids.includes(Number(commit.id))} onChange={(event) => setPullForm((current) => ({ ...current, commit_ids: event.target.checked ? [...current.commit_ids, Number(commit.id)] : current.commit_ids.filter((id) => id !== Number(commit.id)) }))} /><span className="min-w-0"><span className="block truncate text-[#c9d1d9]">{commit.commit_message}</span><span className="font-mono text-[#848d97]">{commit.sha.slice(0, 7)}</span></span></label>)}</div></fieldset>}
              <div className="mt-4 flex justify-end gap-2"><button type="button" className={buttonClass} onClick={() => setShowPullForm(false)}>Cancel</button><button className={primaryButtonClass} disabled={busy || !pullForm.title.trim() || !pullForm.source_branch.trim() || !pullForm.target_branch.trim()}>{busy ? "Creating..." : "Create pull request"}</button></div>
            </form>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] px-4 py-3 text-xs text-[#848d97] sm:px-5"><span><strong className="text-[#e6edf3]">{openPulls} Open</strong> · {pulls.filter((pull) => pull.state === "merged").length} Merged · {pulls.filter((pull) => pull.state === "closed").length} Closed</span><span>{pulls.length} pull requests</span></div>
          {pulls.length === 0 ? <div className="px-5 py-14 text-center"><FiGitBranch className="mx-auto mb-3 text-2xl text-[#848d97]" /><h3 className="font-semibold">No pull requests yet</h3><p className="mt-1 text-sm text-[#848d97]">Propose, discuss, and review changes to this repository.</p></div> : (
            <ul className="divide-y divide-[#212830]">
              {pulls.map((pull) => (
                <li key={pull.id}>
                  <article className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><StateBadge state={pull.state} pull /><button onClick={() => openPull(pull)} className="text-left font-semibold text-[#e6edf3] hover:text-[#58a6ff]">{pull.title}</button><span className="text-sm text-[#848d97]">#{pull.pull_number}</span></div>
                      <MetaLine><span className="text-[#c9d1d9]">{pull.source_branch}</span> → <span className="text-[#c9d1d9]">{pull.target_branch}</span> · opened by {pull.author_username || "a contributor"} · {new Date(pull.created_at).toLocaleDateString()}</MetaLine>
                      {pull.commits?.length > 0 && <MetaLine>{pull.commits.length} linked commit{pull.commits.length === 1 ? "" : "s"}</MetaLine>}
                      {pull.body && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-[#c9d1d9]">{pull.body}</p>}
                      {pull.issue_id && <MetaLine>Linked issue #{issues.find((issue) => Number(issue.id) === Number(pull.issue_id))?.issue_number || pull.issue_id}</MetaLine>}
                    </div>
                    <div className="flex items-start gap-2 sm:justify-end"><button className={buttonClass} onClick={() => openPull(pull)}><FiMessageCircle /> Review</button>{user && pull.state === "open" && <button className={buttonClass} disabled={busy} onClick={() => updatePullState(pull, "merged")}><FiGitMerge /> Merge</button>}</div>
                  </article>
                  {expandedPull?.id === pull.id && (
                    <div className="border-t border-[#30363d] bg-[#0b0f14] px-4 py-5 sm:px-8">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><StateBadge state={expandedPull.state} pull /><span className="text-sm text-[#848d97]">{expandedPull.source_branch} → {expandedPull.target_branch}</span></div>{user && <div className="flex gap-2">{expandedPull.state === "open" ? <><button className={buttonClass} disabled={busy} onClick={() => updatePullState(expandedPull, "closed")}><FiX /> Close</button><button className={primaryButtonClass} disabled={busy} onClick={() => updatePullState(expandedPull, "merged")}><FiGitMerge /> Merge pull request</button></> : <button className={buttonClass} disabled={busy} onClick={() => updatePullState(expandedPull, "open")}><FiCheck /> Reopen</button>}</div>}</div>
                      <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-4"><p className="mb-2 text-xs text-[#848d97]">@{expandedPull.author_username || "contributor"} proposed these changes</p><p className="whitespace-pre-wrap text-sm leading-6 text-[#c9d1d9]">{expandedPull.body || "No description provided."}</p></div>
                      <div className="my-5 rounded-md border border-[#30363d] bg-[#0d1117]">
                        <div className="border-b border-[#30363d] px-4 py-3 text-sm font-semibold">Commits <span className="ml-1 rounded-full bg-[#212830] px-2 py-0.5 text-xs text-[#c9d1d9]">{expandedPull.commits?.length || 0}</span></div>
                        {expandedPull.commits?.length ? <ul className="divide-y divide-[#212830]">{expandedPull.commits.map((commit) => <li key={commit.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span className="min-w-0 truncate text-[#c9d1d9]">{commit.commit_message}</span><span className="font-mono text-xs text-[#848d97]">{commit.sha.slice(0, 7)} · {commit.author_username || "unknown"}</span></li>)}</ul> : <p className="px-4 py-3 text-sm text-[#848d97]">No linked commits. Link commits when opening a pull request.</p>}
                      </div>
                      <div className="my-5 flex items-center gap-2 text-xs uppercase tracking-wide text-[#848d97]"><FiMessageCircle /> Reviews <span className="rounded-full bg-[#212830] px-2 py-0.5">{expandedPull.reviews?.length || 0}</span></div>
                      <div className="space-y-3">{expandedPull.reviews?.map((review) => <div key={review.id} className="rounded-md border border-[#30363d] bg-[#0d1117] p-4"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-[#e6edf3]">{review.author_username || "contributor"}</span><span className="rounded-full bg-[#212830] px-2 py-0.5 text-xs capitalize text-[#c9d1d9]">{review.state.replaceAll("_", " ")}</span><span className="text-xs text-[#848d97]">{new Date(review.created_at).toLocaleString()}</span></div>{review.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#c9d1d9]">{review.body}</p>}</div>)}</div>
                      {user && expandedPull.state === "open" && <form onSubmit={(event) => submitReview(event, expandedPull)} className="mt-4 rounded-md border border-[#30363d] bg-[#0d1117] p-4"><h3 className="mb-3 text-sm font-semibold">Submit a review</h3><div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]"><select className={inputClass} value={reviewForm.state} onChange={(event) => setReviewForm({ ...reviewForm, state: event.target.value })}><option value="commented">Comment</option><option value="approved">Approve</option><option value="changes_requested">Request changes</option></select><textarea className={`${inputClass} min-h-20 resize-y`} value={reviewForm.body} onChange={(event) => setReviewForm({ ...reviewForm, body: event.target.value })} placeholder="Leave a review comment" aria-label="Review comment" /></div><div className="mt-3 flex justify-end"><button className={primaryButtonClass} disabled={busy}>Submit review</button></div></form>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}