import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../api.js";
import { FiBox } from "../Component/icons.js";

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
    <div className="mx-auto w-full max-w-[340px] px-4 py-10 sm:py-14">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#30363d] bg-[#161b22] text-xl text-white"><FiBox /></div>
        <h1 className="text-2xl font-semibold text-[#e6edf3]">Sign in to OSS</h1>
      </div>
      <form className="space-y-4 rounded-md border border-[#30363d] bg-[#161b22] p-4" onSubmit={submit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#e6edf3]">Email address</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 py-2 text-sm text-white focus:border-[#4493f8] focus:outline-none" placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#e6edf3]">Password</label>
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 py-2 text-sm text-white focus:border-[#4493f8] focus:outline-none" placeholder="Your password" />
        </div>
        {error && <p role="alert" className="rounded-md border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#ff7b72]">{error}</p>}
        <button type="submit" className="w-full rounded-md border border-[#3fb950] bg-[#238636] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2ea043]">
          Sign in
        </button>
      </form>
      <p className="mt-4 rounded-md border border-[#30363d] px-4 py-4 text-center text-sm text-[#c9d1d9]">
        New to OSS? <Link to="/register" className="text-[#58a6ff] hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
