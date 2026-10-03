import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function NewRepo() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", visibility: "public", language: "JavaScript" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const repo = await api("/api/repos", { method: "POST", body: form });
      navigate(`/repos/${repo.full_name}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-16 p-8 border border-neutral-800 bg-neutral-950">
      <h1 className="text-2xl font-bold text-white uppercase tracking-widest mb-8">New repository</h1>
      <form className="space-y-5" onSubmit={submit}>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-black border border-neutral-700 py-3 px-4 text-white font-mono text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-black border border-neutral-700 py-3 px-4 text-white font-mono text-sm h-24" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">Visibility</label>
            <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full bg-black border border-neutral-700 py-3 px-4 text-white text-sm">
              <option value="public">public</option>
              <option value="private">private</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">Language</label>
            <input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full bg-black border border-neutral-700 py-3 px-4 text-white font-mono text-sm" />
          </div>
        </div>
        {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
        <button className="w-full bg-white text-black font-bold py-3 uppercase tracking-widest text-sm">Create repository</button>
      </form>
    </div>
  );
}
