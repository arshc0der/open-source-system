import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { FiBox, FiPlus, FiUsers, FiX } from "../Component/icons.js";

const fieldClass = "w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder:text-[#848d97] outline-none focus:border-[#4493f8] focus:ring-2 focus:ring-[#4493f8]/25";
const actionClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#3d444d] bg-[#212830] px-3 text-sm font-medium text-[#e6edf3] hover:bg-[#30363d] disabled:opacity-50";
const primaryClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#3fb950] bg-[#238636] px-3 text-sm font-semibold text-white hover:bg-[#2ea043] disabled:opacity-50";

export default function Organizations({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [orgForm, setOrgForm] = useState({ name: "", display_name: "", description: "" });
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [teamForm, setTeamForm] = useState({ name: "", description: "" });
  const [teamMemberNames, setTeamMemberNames] = useState({});
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const rows = await api("/api/organizations");
    setOrganizations(rows);
    if (id) setOrganization(await api(`/api/organizations/${id}`));
    else setOrganization(null);
  }, [id]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const rows = await api("/api/organizations");
        if (!active) return;
        setOrganizations(rows);
        setOrganization(id ? await api(`/api/organizations/${id}`) : null);
      } catch (err) {
        if (active) setError(err.message);
      }
    };
    void fetchData();
    return () => { active = false; };
  }, [id]);

  const run = async (action) => {
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

  const createOrganization = (event) => {
    event.preventDefault();
    void run(async () => {
      const created = await api("/api/organizations", { method: "POST", body: orgForm });
      setOrgForm({ name: "", display_name: "", description: "" });
      setShowOrgForm(false);
      await load();
      navigate(`/organizations/${created.id}`);
    });
  };

  const addMember = (event) => {
    event.preventDefault();
    void run(async () => {
      await api(`/api/organizations/${id}/members`, { method: "POST", body: { username: memberName, role: memberRole } });
      setMemberName("");
      await load();
    });
  };

  const createTeam = (event) => {
    event.preventDefault();
    void run(async () => {
      await api(`/api/organizations/${id}/teams`, { method: "POST", body: teamForm });
      setTeamForm({ name: "", description: "" });
      await load();
    });
  };

  const addTeamMember = (event, team) => {
    event.preventDefault();
    const username = teamMemberNames[team.id]?.trim();
    if (!username) return;
    void run(async () => {
      await api(`/api/organizations/${id}/teams/${team.id}/members`, { method: "POST", body: { username } });
      setTeamMemberNames((current) => ({ ...current, [team.id]: "" }));
      await load();
    });
  };

  const removeTeamMember = (team, person) => {
    void run(async () => {
      await api(`/api/organizations/${id}/teams/${team.id}/members/${person.id}`, { method: "DELETE" });
      await load();
    });
  };

  if (!user) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#848d97]">Sign in to manage organizations.</div>;
  if (!id) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 text-[#e6edf3] sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-5">
          <div><p className="text-xs font-medium uppercase text-[#848d97]">Workspace</p><h1 className="mt-1 text-2xl font-semibold">Organizations</h1></div>
          <button className={primaryClass} onClick={() => setShowOrgForm((value) => !value)}><FiPlus /> New organization</button>
        </div>
        {error && <div role="alert" className="mb-4 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#ff7b72]">{error}</div>}
        {showOrgForm && <form onSubmit={createOrganization} className="mb-6 grid gap-3 rounded-lg border border-[#30363d] bg-[#161b22] p-4 md:grid-cols-3"><input className={fieldClass} required value={orgForm.name} onChange={(event) => setOrgForm({ ...orgForm, name: event.target.value })} placeholder="Organization slug" aria-label="Organization name" /><input className={fieldClass} value={orgForm.display_name} onChange={(event) => setOrgForm({ ...orgForm, display_name: event.target.value })} placeholder="Display name" aria-label="Display name" /><input className={fieldClass} value={orgForm.description} onChange={(event) => setOrgForm({ ...orgForm, description: event.target.value })} placeholder="Description" aria-label="Description" /><div className="flex justify-end gap-2 md:col-span-3"><button type="button" className={actionClass} onClick={() => setShowOrgForm(false)}>Cancel</button><button className={primaryClass} disabled={busy || !orgForm.name.trim()}>Create organization</button></div></form>}
        <div className="overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1117]">
          <div className="border-b border-[#30363d] bg-[#161b22] px-4 py-3 text-sm font-semibold">Your organizations <span className="ml-1 rounded-full bg-[#30363d] px-2 py-0.5 text-xs text-[#c9d1d9]">{organizations.length}</span></div>
          {organizations.length ? organizations.map((org) => <Link key={org.id} to={`/organizations/${org.id}`} className="flex items-center justify-between gap-4 border-b border-[#212830] px-4 py-4 last:border-0 hover:bg-[#161b22]"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#3d444d] bg-[#212830]"><FiBox /></span><span className="min-w-0"><strong className="block truncate text-sm text-[#58a6ff]">{org.display_name || org.name}</strong><span className="text-xs text-[#848d97]">{org.name} · {org.role}</span></span></div><span className="text-xs text-[#848d97]">Open workspace →</span></Link>) : <div className="p-10 text-center text-sm text-[#848d97]">No organizations yet. Create one to coordinate members and teams.</div>}
        </div>
      </main>
    );
  }

  if (!organization) return <main className="mx-auto max-w-6xl px-4 py-12 text-sm text-[#848d97]">Loading organization...</main>;
  const canManage = ["owner", "admin"].includes(organizations.find((org) => Number(org.id) === Number(id))?.role);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-[#e6edf3] sm:px-6">
      <div className="mb-6 border-b border-[#30363d] pb-5"><Link to="/organizations" className="text-xs text-[#848d97] hover:text-[#58a6ff]">Organizations</Link><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">{organization.display_name || organization.name}</h1><p className="mt-1 text-sm text-[#848d97]">{organization.description || organization.name}</p></div><span className="rounded-full border border-[#3d444d] px-3 py-1 text-xs capitalize text-[#c9d1d9]">{organizations.find((org) => Number(org.id) === Number(id))?.role || "member"}</span></div></div>
      {error && <div role="alert" className="mb-4 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#ff7b72]">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <section className="overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><FiUsers /> Members <span className="rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{organization.members?.length || 0}</span></h2></div>
          {canManage && <form onSubmit={addMember} className="grid gap-2 border-b border-[#30363d] p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]"><input className={fieldClass} required value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Username" aria-label="Member username" /><select className={fieldClass} value={memberRole} onChange={(event) => setMemberRole(event.target.value)} aria-label="Organization role"><option value="member">Member</option><option value="admin">Admin</option></select><button className={actionClass} disabled={busy}>Add member</button></form>}
          <ul className="divide-y divide-[#212830]">{organization.members?.map((person) => <li key={person.id} className="flex items-center justify-between gap-4 px-4 py-3"><div className="min-w-0"><Link to={`/profile/${person.username}`} className="text-sm font-medium text-[#58a6ff] hover:underline">{person.display_name || person.username}</Link><p className="text-xs text-[#848d97]">@{person.username}</p></div><span className="rounded-full bg-[#212830] px-2.5 py-1 text-xs capitalize text-[#c9d1d9]">{person.role}</span></li>)}</ul>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><FiUsers /> Teams <span className="rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{organization.teams?.length || 0}</span></h2></div>
          {canManage && <form onSubmit={createTeam} className="space-y-2 border-b border-[#30363d] p-3"><input className={fieldClass} required value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} placeholder="Team name" aria-label="Team name" /><input className={fieldClass} value={teamForm.description} onChange={(event) => setTeamForm({ ...teamForm, description: event.target.value })} placeholder="Team purpose" aria-label="Team description" /><button className={primaryClass} disabled={busy || !teamForm.name.trim()}><FiPlus /> Create team</button></form>}
          <div className="divide-y divide-[#212830]">{organization.teams?.map((team) => <article key={team.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{team.name}</h3><p className="mt-1 text-xs text-[#848d97]">{team.description || "No team description"}</p></div><span className="shrink-0 rounded-full bg-[#212830] px-2 py-1 text-xs text-[#c9d1d9]">{team.members?.length || 0}</span></div><div className="mt-3 flex flex-wrap gap-2">{team.members?.map((person) => <span key={person.id} className="inline-flex items-center gap-1 rounded-full border border-[#3d444d] px-2 py-1 text-xs text-[#c9d1d9]">@{person.username}{canManage && <button type="button" className="text-[#848d97] hover:text-[#ff7b72]" onClick={() => removeTeamMember(team, person)} title={`Remove ${person.username}`} aria-label={`Remove ${person.username}`}><FiX /></button>}</span>)}{!team.members?.length && <span className="text-xs text-[#848d97]">No team members</span>}</div>{canManage && <form onSubmit={(event) => addTeamMember(event, team)} className="mt-3 flex gap-2"><input className={fieldClass} value={teamMemberNames[team.id] || ""} onChange={(event) => setTeamMemberNames((current) => ({ ...current, [team.id]: event.target.value }))} placeholder="Add organization username" aria-label={`Add member to ${team.name}`} /><button className={actionClass} disabled={busy || !teamMemberNames[team.id]?.trim()}>Add</button></form>}</article>)}{!organization.teams?.length && <p className="p-6 text-center text-sm text-[#848d97]">No teams yet.</p>}</div>
        </section>
      </div>
    </main>
  );
}