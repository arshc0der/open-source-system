import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./Component/Navbar.jsx";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Repositories from "./Pages/Repositories.jsx";
import RepoDetail from "./Pages/RepoDetail.jsx";
import NewRepo from "./Pages/NewRepo.jsx";
import Notifications from "./Pages/Notifications.jsx";
import { clearSession, getStoredUser } from "./api.js";

export default function App() {
  const [user, setUser] = useState(getStoredUser());

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: localStorage.getItem("oss_session_token") }),
      });
    } catch {
      /* session revoke is best-effort */
    }
    clearSession();
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-neutral-200 font-sans overflow-x-hidden selection:bg-white selection:text-black">
        <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none" />
        <Navbar user={user} onLogout={logout} />
        <main className="relative z-10 flex-grow min-h-[calc(100vh-64px)] pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onAuth={setUser} />} />
            <Route path="/register" element={<Register onAuth={setUser} />} />
            <Route path="/explore" element={<Repositories />} />
            <Route path="/repos/:owner/:name" element={<RepoDetail user={user} />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/new" element={user ? <NewRepo /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
