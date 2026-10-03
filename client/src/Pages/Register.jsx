import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../api.js";

export default function Register({ onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
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
    <div className="max-w-md w-full mx-auto mt-24 p-8 border border-neutral-800 bg-neutral-950">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Register</h2>
        <p className="text-neutral-500 mt-2 text-xs font-mono uppercase">Create a new account</p>
      </div>
      <form className="space-y-5" onSubmit={submit}>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Username</label>
          <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="Choose a username" />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Password</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-white font-mono text-sm" placeholder="At least 8 characters" />
        </div>
        {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
        <button type="submit" className="w-full bg-transparent border border-white text-white font-bold py-3 px-4 rounded-sm hover:bg-white hover:text-black uppercase tracking-widest text-sm mt-6">
          Register
        </button>
      </form>
      <p className="mt-8 text-center text-neutral-500 text-xs uppercase tracking-wider">
        Already have an account? <Link to="/login" className="text-white hover:text-blue-400 hover:underline">Login</Link>
      </p>
    </div>
  );
}
