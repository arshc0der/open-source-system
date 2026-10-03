import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../api.js";

export default function Login({ onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: form });
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
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Login</h2>
        <p className="text-neutral-500 mt-2 text-xs font-mono uppercase">Sign in to your account</p>
      </div>
      <form className="space-y-6" onSubmit={submit}>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-blue-500 font-mono text-sm" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Password</label>
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-black border border-neutral-700 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-blue-500 font-mono text-sm" placeholder="Your password" />
        </div>
        {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
        <button type="submit" className="w-full bg-white text-black font-bold py-3 px-4 rounded-sm hover:bg-neutral-200 uppercase tracking-widest text-sm">
          Login
        </button>
      </form>
      <p className="mt-8 text-center text-neutral-500 text-xs uppercase tracking-wider">
        Don't have an account? <Link to="/register" className="text-white hover:text-blue-400 hover:underline">Register</Link>
      </p>
    </div>
  );
}
