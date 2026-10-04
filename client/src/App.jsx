import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./Component/Navbar.jsx";
import Footer from "./Component/Footer.jsx";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Repositories from "./Pages/Repositories.jsx";
import RepoDetail from "./Pages/RepoDetail.jsx";
import NewRepo from "./Pages/NewRepo.jsx";
import Notifications from "./Pages/Notifications.jsx";
import Profile from "./Pages/Profile.jsx";
import Organizations from "./Pages/Organizations.jsx";
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
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#0d1117] text-[#e6edf3] selection:bg-[#1f6feb] selection:text-white">
        <Navbar user={user} onLogout={logout} />
        <main className="min-h-[calc(100vh-128px)] flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onAuth={setUser} />} />
            <Route path="/register" element={<Register onAuth={setUser} />} />
            <Route path="/explore" element={<Repositories />} />
            <Route path="/organizations" element={user ? <Organizations user={user} /> : <Navigate to="/login" />} />
            <Route path="/organizations/:id" element={user ? <Organizations user={user} /> : <Navigate to="/login" />} />
            <Route path="/repos/:owner/:name" element={<RepoDetail user={user} />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile/:username" element={<Profile user={user} />} />
            <Route path="/new" element={user ? <NewRepo /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
