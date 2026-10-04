import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getStoredUser } from "../api.js";

export default function NewRepo() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", visibility: "public", language: "JavaScript" });
  const [organizations, setOrganizations] = useState([]);
  const [ownerOrganizationId, setOwnerOrganizationId] = useState("");
  const [topicText, setTopicText] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let active = true;
    api("/api/organizations")
      .then((rows) => { if (active) setOrganizations(rows); })
      .catch(() => { if (active) setOrganizations([]); });
    return () => { active = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      const files = await Promise.all(
        Array.from(uploadFiles).map(async (file) => ({
          path: (file.webkitRelativePath || file.name).replace(/^\/+/, ""),
          type: "file",
          content: await file.text(),
          commitMessage: `Upload ${file.name}`,
        }))
      );

      const repo = await api("/api/repos", {
        method: "POST",
        body: {
          ...form,
          owner_organization_id: ownerOrganizationId || null,
          topics: topicText.split(",").map((topic) => topic.trim()).filter(Boolean),
          files,
        },
      });
      navigate(`/repos/${repo.full_name}`);
    } catch (err) {
      setError(err.message || "Unable to create repository");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="github-card p-6 md:p-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-400 mb-3">New repository</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Create a GitHub-style project</h1>
        </div>

        <form className="space-y-6" onSubmit={submit}>
          <div>
            <label className="github-label" htmlFor="repo-owner">Owner</label>
            <select id="repo-owner" value={ownerOrganizationId} onChange={(event) => setOwnerOrganizationId(event.target.value)} className="github-input">
              <option value="">{`Personal account (${getStoredUser()?.username || "me"})`}</option>
              {organizations.filter((organization) => ["owner", "admin"].includes(organization.role)).map((organization) => <option key={organization.id} value={organization.id}>{organization.display_name || organization.name} · organization</option>)}
            </select>
            <p className="mt-1 text-xs text-neutral-500">Only organization owners and admins can create repositories for an organization.</p>
          </div>
          <div>
            <label className="github-label">Repository name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="github-input"
              placeholder="my-awesome-project"
            />
          </div>

          <div>
            <label className="github-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="github-input h-28"
              placeholder="Short description of the project"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="github-label">Visibility</label>
              <select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                className="github-input"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label className="github-label">Language</label>
              <input
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="github-input"
                placeholder="JavaScript"
              />
            </div>
          </div>

          <div>
            <label className="github-label" htmlFor="repo-topics">Topics</label>
            <input
              id="repo-topics"
              value={topicText}
              onChange={(e) => setTopicText(e.target.value)}
              className="github-input"
              placeholder="react, api, developer-tools"
            />
          </div>

          <div className="rounded-2xl border border-dashed border-neutral-700 bg-black/30 p-4">
            <label className="github-label">Upload project files</label>
            <input
              type="file"
              multiple
              webkitdirectory=""
              directory=""
              onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-neutral-200"
            />
            {uploadFiles.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-auto pr-2">
                {uploadFiles.slice(0, 8).map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-xs font-mono text-neutral-300">
                    <span className="truncate">{file.webkitRelativePath || file.name}</span>
                    <span className="text-neutral-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
                {uploadFiles.length > 8 && <p className="text-xs text-neutral-500">+{uploadFiles.length - 8} more files</p>}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400 font-mono">{error}</p>}

          <button type="submit" disabled={isCreating} className="github-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70">
            {isCreating ? "Creating repository..." : "Create repository"}
          </button>
        </form>
      </div>
    </div>
  );
}
