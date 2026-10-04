import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, apiUpload } from "../api.js";
import { FiBox, FiGitBranch, FiStar, FiUsers } from "../Component/icons.js";
import ContributionGraph from "../Component/ContributionGraph.jsx";

export default function Profile({ user }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api(`/api/profile/${username}`);
      setProfile(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [username]);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const data = await api(`/api/profile/${username}`);
        if (active) setProfile(data);
      } catch (err) {
        if (active) setError(err.message);
      }
    };
    void loadProfile();
    return () => { active = false; };
  }, [username]);

  const toggleFollow = async () => {
    if (!user) return navigate("/login");
    setBusy(true);
    try {
      await api(`/api/users/${profile.id}/follow`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    setUploadingAvatar(true);
    setError("");
    try {
      await apiUpload("/api/me/avatar", file);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (error && !profile) return <main className="page-shell text-sm text-[#ff7b72]">{error}</main>;
  if (!profile) return <main className="page-shell text-sm text-[#848d97]">Loading profile...</main>;

  const isOwnProfile = user && Number(user.id) === Number(profile.id);
  const repositories = (profile.repositories || []).filter((repo) => {
    const term = query.toLowerCase();
    return !term || repo.name.toLowerCase().includes(term) || (repo.description || "").toLowerCase().includes(term);
  });

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-7 text-[#e6edf3] sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {error && <p role="alert" className="col-span-full rounded-md border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
      <aside className="min-w-0">
        <div className="mx-auto w-full max-w-[280px] lg:mx-0">
          <div className="mb-4 aspect-square overflow-hidden rounded-full border border-[#30363d] bg-[#161b22]">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={`${profile.username} avatar`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-7xl font-semibold text-[#848d97]">{(profile.display_name || profile.username || "U").charAt(0).toUpperCase()}</div>}
          </div>
          <h1 className="text-2xl font-semibold">{profile.display_name || profile.username}</h1>
          <p className="mb-4 text-xl font-light text-[#848d97]">{profile.username}</p>
          {profile.bio && <p className="mb-4 text-sm leading-6 text-[#c9d1d9]">{profile.bio}</p>}
          {isOwnProfile ? <div className="mb-4 grid grid-cols-2 gap-2"><Link to="/dashboard#profile-settings" className="flex min-h-9 items-center justify-center rounded-md border border-[#3d444d] bg-[#212830] px-3 text-sm font-medium hover:bg-[#30363d]">Edit profile</Link><label className="flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-[#3d444d] bg-[#212830] px-3 text-sm font-medium hover:bg-[#30363d]">{uploadingAvatar ? "Uploading..." : "Change photo"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={uploadAvatar} disabled={uploadingAvatar} /></label></div> : <button disabled={busy} onClick={toggleFollow} className="mb-4 min-h-9 w-full rounded-md border border-[#3d444d] bg-[#212830] px-3 text-sm font-medium hover:bg-[#30363d] disabled:opacity-50">{busy ? "Updating..." : profile.is_following ? "Following" : "Follow"}</button>}
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-[#30363d] pb-4 text-sm text-[#848d97]"><button onClick={() => setTab("followers")} className="inline-flex items-center gap-1.5 hover:text-[#58a6ff]"><FiUsers /><strong className="text-[#e6edf3]">{profile.followers || 0}</strong> followers</button><button onClick={() => setTab("following")} className="hover:text-[#58a6ff]"><strong className="text-[#e6edf3]">{profile.following || 0}</strong> following</button></div>
          <div className="mt-4 space-y-2 text-sm text-[#c9d1d9]">{profile.company && <p>{profile.company}</p>}{profile.location && <p>{profile.location}</p>}{profile.website_url && <a href={profile.website_url} target="_blank" rel="noreferrer" className="block break-all text-[#58a6ff] hover:underline">{profile.website_url}</a>}</div>
          <p className="mt-4 border-t border-[#30363d] pt-4 text-xs text-[#848d97]">Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
        </div>
      </aside>

      <section className="min-w-0">
        <nav aria-label="Profile sections" className="mb-5 flex gap-5 overflow-x-auto border-b border-[#30363d] text-sm">
          <button onClick={() => setTab("overview")} className={`whitespace-nowrap border-b-2 px-1 pb-3 ${tab === "overview" ? "border-[#f78166] font-semibold text-white" : "border-transparent text-[#848d97] hover:text-white"}`}>Overview</button>
          <button onClick={() => setTab("repositories")} className={`whitespace-nowrap border-b-2 px-1 pb-3 ${tab === "repositories" ? "border-[#f78166] font-semibold text-white" : "border-transparent text-[#848d97] hover:text-white"}`}>Repositories <span className="ml-1 rounded-full bg-[#212830] px-2 py-0.5 text-xs">{profile.repositories?.length || 0}</span></button>
          <button onClick={() => setTab("followers")} className={`whitespace-nowrap border-b-2 px-1 pb-3 ${tab === "followers" ? "border-[#f78166] font-semibold text-white" : "border-transparent text-[#848d97] hover:text-white"}`}>Followers</button>
          <button onClick={() => setTab("following")} className={`whitespace-nowrap border-b-2 px-1 pb-3 ${tab === "following" ? "border-[#f78166] font-semibold text-white" : "border-transparent text-[#848d97] hover:text-white"}`}>Following</button>
        </nav>

        {tab === "overview" && <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Popular repositories</h2>{isOwnProfile && <Link to="/new" className="inline-flex items-center gap-1.5 rounded-md border border-[#3d444d] bg-[#212830] px-3 py-1.5 text-xs font-medium hover:bg-[#30363d]">Create repository</Link>}</div>
          {profile.repositories?.length ? <div className="grid gap-3 md:grid-cols-2">{profile.repositories.slice(0, 6).map((repo) => <RepositoryCard key={repo.id} repo={repo} />)}</div> : <EmptyRepositories isOwnProfile={isOwnProfile} />}
          <div className="mt-7"><ContributionGraph activity={profile.activity} /></div>
        </>}

        {tab === "repositories" && <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Repositories <span className="text-[#848d97]">({repositories.length})</span></h2><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a repository..." aria-label="Find a repository" className="w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 py-2 text-sm text-white placeholder:text-[#848d97] sm:w-64" /></div>
          <div className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">{repositories.map((repo) => <RepositoryRow key={repo.id} repo={repo} />)}{!repositories.length && <p className="p-8 text-center text-sm text-[#848d97]">{query ? "No repositories match that search." : "No repositories yet."}</p>}</div>
        </>}

        {(tab === "followers" || tab === "following") && <section className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]"><div className="border-b border-[#30363d] bg-[#161b22] px-4 py-3 text-sm font-semibold">{tab === "followers" ? "People who follow this account" : "People this account follows"}</div>{(tab === "followers" ? profile.followers_list : profile.following_list)?.map((person) => <div key={person.id} className="flex items-center justify-between gap-3 border-b border-[#212830] px-4 py-3 last:border-0"><Link to={`/profile/${person.username}`} className="flex min-w-0 items-center gap-3 text-sm text-[#58a6ff] hover:underline"><span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#3d444d] bg-[#212830]">{person.avatar_url ? <img src={person.avatar_url} alt="" className="h-full w-full object-cover" /> : person.username.charAt(0).toUpperCase()}</span><span className="min-w-0"><strong className="block truncate">{person.display_name || person.username}</strong><span className="text-xs text-[#848d97]">@{person.username}</span></span></Link>{user && Number(user.id) !== Number(person.id) && <Link to={`/profile/${person.username}`} className="rounded-md border border-[#3d444d] bg-[#212830] px-3 py-1.5 text-xs text-[#c9d1d9] hover:bg-[#30363d]">View profile</Link>}</div>)}{!(tab === "followers" ? profile.followers_list : profile.following_list)?.length && <p className="p-8 text-center text-sm text-[#848d97]">No {tab} yet.</p>}</section>}
      </section>
    </main>
  );
}

function RepositoryCard({ repo }) {
  return <Link to={`/repos/${repo.full_name}`} className="block rounded-md border border-[#30363d] bg-[#0d1117] p-4 hover:border-[#8b949e]"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-sm font-semibold text-[#58a6ff]">{repo.name}</h3><span className="shrink-0 rounded-full border border-[#3d444d] px-2 py-0.5 text-[11px] capitalize text-[#848d97]">{repo.visibility}</span></div><p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#848d97]">{repo.description || "No description provided."}</p><div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#848d97]">{repo.language && <span>{repo.language}</span>}<span className="inline-flex items-center gap-1"><FiStar />{repo.star_count || 0}</span></div></Link>;
}

function RepositoryRow({ repo }) {
  return <article className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212830] px-4 py-4 last:border-0"><div className="min-w-0"><Link to={`/repos/${repo.full_name}`} className="text-base font-semibold text-[#58a6ff] hover:underline">{repo.name}</Link><span className="ml-2 rounded-full border border-[#3d444d] px-2 py-0.5 text-[11px] capitalize text-[#848d97]">{repo.visibility}</span><p className="mt-1 text-sm text-[#848d97]">{repo.description || "No description provided."}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-[#848d97]">{repo.language && <span>{repo.language}</span>}<span>Updated {String(repo.updated_at).slice(0, 10)}</span></div></div><div className="flex items-center gap-1 text-xs text-[#848d97]"><FiGitBranch /> {repo.default_branch || "main"}<span className="ml-3 inline-flex items-center gap-1"><FiStar />{repo.star_count || 0}</span></div></article>;
}

function EmptyRepositories({ isOwnProfile }) {
  return <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-8 text-center"><FiBox className="mx-auto mb-3 text-2xl text-[#848d97]" /><p className="text-sm text-[#c9d1d9]">No public repositories to show.</p>{isOwnProfile && <Link to="/new" className="mt-3 inline-flex rounded-md bg-[#238636] px-3 py-2 text-sm font-medium text-white hover:bg-[#2ea043]">Create a repository</Link>}</div>;
}
