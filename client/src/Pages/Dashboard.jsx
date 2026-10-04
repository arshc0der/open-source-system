import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { FiActivity, FiBox, FiPlus, FiSettings, FiStar, FiUser } from "../Component/icons.js";
import ContributionGraph from "../Component/ContributionGraph.jsx";

const fieldClass = "w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder:text-[#848d97] outline-none focus:border-[#4493f8] focus:ring-2 focus:ring-[#4493f8]/25";

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState({ display_name: "", bio: "", location: "", company: "", website_url: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const me = await api("/api/me");
    setData(me);
    setProfile({
      display_name: me.user.display_name || "",
      bio: me.user.bio || "",
      location: me.user.location || "",
      company: me.user.company || "",
      website_url: me.user.website_url || "",
    });
    try {
      const users = await api("/api/users");
      setPeople((users || []).filter((person) => Number(person.id) !== Number(me.user.id)));
    } catch {
      setPeople([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      try {
        await load();
      } catch (err) {
        if (!active) return;
        setError(err.message);
        if (err.status === 401) navigate("/login");
      }
    };
    void loadDashboard();
    return () => { active = false; };
  }, [load, navigate]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await api("/api/me", { method: "PATCH", body: profile });
      setData((current) => ({ ...current, user: { ...current.user, ...updated } }));
      setNotice("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("This permanently deletes your account. Continue?")) return;
    await api("/api/me", { method: "DELETE" });
    window.localStorage.clear();
    window.location.href = "/";
  };

  const toggleFollow = async (personId) => {
    await api(`/api/users/${personId}/follow`, { method: "POST" });
    await load();
  };

  if (error && !data) return <p className="page-shell text-sm text-[#ff7b72]">{error}</p>;
  if (!data) return <main className="page-shell text-sm text-[#848d97]">Loading your workspace...</main>;

  const profileInfo = data.user || user;
  const repos = data.repositories || [];
  const totalStars = repos.reduce((sum, repo) => sum + Number(repo.star_count || 0), 0);

  return (
    <main className="page-shell max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#3d444d] bg-[#212830] text-lg font-semibold text-white">
            {profileInfo.avatar_url ? <img src={profileInfo.avatar_url} alt="" className="h-full w-full object-cover" /> : (profileInfo.display_name || profileInfo.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0"><p className="text-xs text-[#848d97]">Signed in as</p><h1 className="truncate text-xl font-semibold text-[#e6edf3]">{profileInfo.display_name || profileInfo.username}</h1><p className="text-sm text-[#848d97]">@{profileInfo.username}</p></div>
        </div>
        <Link to="/new" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#3fb950] bg-[#238636] px-3 text-sm font-semibold text-white hover:bg-[#2ea043]"><FiPlus /> New repository</Link>
      </header>

      <nav aria-label="Dashboard sections" className="mb-6 flex gap-5 border-b border-[#30363d] text-sm">
        <a href="#overview" className="border-b-2 border-[#f78166] pb-3 font-semibold text-white">Overview</a>
        <a href="#repositories" className="pb-3 text-[#848d97] hover:text-white">Repositories <span className="ml-1 rounded-full bg-[#212830] px-2 py-0.5 text-xs">{repos.length}</span></a>
        <a href="#profile-settings" className="pb-3 text-[#848d97] hover:text-white">Settings</a>
      </nav>

      {error && <p role="alert" className="mb-4 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#ff7b72]">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-md border border-[#3fb950]/40 bg-[#238636]/10 p-3 text-sm text-[#3fb950]">{notice}</p>}

      <div id="overview" className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-md border border-[#30363d] bg-[#0d1117] p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Your profile</h2><Link to={`/profile/${profileInfo.username}`} className="text-xs text-[#58a6ff] hover:underline">View profile</Link></div>
            <p className="text-sm leading-6 text-[#c9d1d9]">{profileInfo.bio || "Add a bio to tell people what you work on."}</p>
            {(profileInfo.location || profileInfo.company || profileInfo.website_url) && <div className="mt-3 space-y-2 border-t border-[#30363d] pt-3 text-xs text-[#848d97]">{profileInfo.location && <p>{profileInfo.location}</p>}{profileInfo.company && <p>{profileInfo.company}</p>}{profileInfo.website_url && <a href={profileInfo.website_url} target="_blank" rel="noreferrer" className="block truncate text-[#58a6ff] hover:underline">{profileInfo.website_url}</a>}</div>}
            <div className="mt-4 flex gap-4 border-t border-[#30363d] pt-3 text-sm"><Link to={`/profile/${profileInfo.username}`} className="text-[#848d97] hover:text-[#58a6ff]"><strong className="text-[#e6edf3]">{data.followers}</strong> followers</Link><Link to={`/profile/${profileInfo.username}`} className="text-[#848d97] hover:text-[#58a6ff]"><strong className="text-[#e6edf3]">{data.following}</strong> following</Link></div>
          </section>

          <section id="profile-settings" className="rounded-md border border-[#30363d] bg-[#0d1117]">
            <div className="flex items-center gap-2 border-b border-[#30363d] bg-[#161b22] px-4 py-3"><FiSettings className="text-[#848d97]" /><h2 className="text-sm font-semibold">Profile settings</h2></div>
            <form onSubmit={saveProfile} className="space-y-3 p-4">
              <label className="block text-xs font-medium text-[#c9d1d9]">Display name<input value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              <label className="block text-xs font-medium text-[#c9d1d9]">Bio<textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} className={`${fieldClass} mt-1.5 min-h-20 resize-y`} /></label>
              <label className="block text-xs font-medium text-[#c9d1d9]">Location<input value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              <label className="block text-xs font-medium text-[#c9d1d9]">Company<input value={profile.company} onChange={(event) => setProfile({ ...profile, company: event.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              <label className="block text-xs font-medium text-[#c9d1d9]">Website<input value={profile.website_url} onChange={(event) => setProfile({ ...profile, website_url: event.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              <button disabled={saving} className="w-full rounded-md border border-[#3d444d] bg-[#212830] px-3 py-2 text-sm font-medium hover:bg-[#30363d] disabled:opacity-50">{saving ? "Saving..." : "Save profile"}</button>
            </form>
            <div className="border-t border-[#30363d] p-4"><button onClick={deleteAccount} className="text-xs text-[#ff7b72] hover:underline">Delete account</button></div>
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          <ContributionGraph activity={data.activity} />
          <section id="repositories" className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] bg-[#161b22] px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><FiBox className="text-[#848d97]" /> Your repositories</h2><span className="text-xs text-[#848d97]">{repos.length} total · {totalStars} stars received</span></div>
            {repos.length ? <ul className="divide-y divide-[#212830]">{repos.map((repo) => <li key={repo.id}><Link to={`/repos/${repo.full_name}`} className="block px-4 py-4 hover:bg-[#161b22]"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-[#58a6ff]">{repo.name}</h3><span className="rounded-full border border-[#3d444d] px-2 py-0.5 text-xs capitalize text-[#c9d1d9]">{repo.visibility}</span></div><p className="mt-1 text-sm text-[#848d97]">{repo.description || "No description provided."}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#848d97]">{repo.language && <span>{repo.language}</span>}<span className="inline-flex items-center gap-1"><FiStar /> {repo.star_count || 0}</span><span>{repo.default_branch || "main"}</span><span>Updated {String(repo.updated_at).slice(0, 10)}</span></div></Link></li>)}</ul> : <div className="p-8 text-center"><p className="text-sm text-[#848d97]">You haven’t created a repository yet.</p><Link to="/new" className="mt-3 inline-flex rounded-md bg-[#238636] px-3 py-2 text-sm font-medium text-white hover:bg-[#2ea043]">Create your first repository</Link></div>}
          </section>

          <section className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
            <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><FiActivity className="text-[#848d97]" /> People to follow</h2><Link to="/explore" className="text-xs text-[#58a6ff] hover:underline">Explore projects</Link></div>
            {people.length ? <ul className="divide-y divide-[#212830] sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">{people.slice(0, 8).map((person) => <li key={person.id} className="flex items-center justify-between gap-3 p-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3d444d] bg-[#212830]"><FiUser /></span><Link to={`/profile/${person.username}`} className="min-w-0 truncate text-sm font-medium text-[#58a6ff] hover:underline">{person.display_name || person.username}<span className="block text-xs font-normal text-[#848d97]">@{person.username}</span></Link></div><button onClick={() => toggleFollow(person.id)} className="shrink-0 rounded-md border border-[#3d444d] bg-[#212830] px-3 py-1.5 text-xs font-medium hover:bg-[#30363d]">Follow</button></li>)}</ul> : <p className="p-4 text-sm text-[#848d97]">No other profiles available right now.</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
