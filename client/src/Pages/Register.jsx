import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../api.js";

export default function Register({ onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    display_name: "",
    bio: "",
    location: "",
    company: "",
    website_url: "",
  });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/register", { method: "POST", body: form });
      setSession(data);
      onAuth(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-neutral-500">Join the developer community</p>
      </div>
      <form className="space-y-5 rounded-md border border-neutral-800 bg-neutral-950 p-5 sm:p-6" onSubmit={submit}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Username</label>
            <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="Choose a username" />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Display name</label>
            <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="Your full name" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="you@example.com" />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Password</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="At least 8 characters" />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm h-24" placeholder="Tell people about yourself" />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="City, Country" />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Company</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="College / company" />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Website</label>
            <input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="https://example.com" />
          </div>
        </div>

        {error && <p role="alert" className="rounded-md border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#ff7b72]">{error}</p>}
        <button type="submit" className="w-full rounded-md border border-[#3fb950] bg-[#238636] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2ea043]">
          Create account
        </button>
      </form>
      <p className="mt-4 rounded-md border border-neutral-800 px-4 py-4 text-center text-sm text-neutral-400">
        Already have an account? <Link to="/login" className="text-[#58a6ff] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
