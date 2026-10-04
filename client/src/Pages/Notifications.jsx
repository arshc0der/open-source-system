import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = () => api("/api/notifications").then(setItems).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const mark = async (id) => {
    await api(`/api/notifications/${id}/read`, { method: "PATCH" });
    await load();
  };

  return (
    <div className="page-shell max-w-5xl">
      <div className="mb-6 border-b border-[#30363d] pb-4"><p className="mb-1 text-xs font-medium uppercase text-[#848d97]">Inbox</p><h1 className="text-2xl font-semibold text-white">Notifications</h1></div>
      {error && <p className="text-red-400 font-mono text-sm">{error}</p>}
      <div className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
        {items.map((n) => (
          <div key={n.id} className={`flex flex-wrap items-center justify-between gap-4 border-b border-[#212830] px-4 py-4 last:border-0 ${n.is_read ? "text-neutral-500" : "text-white"}`}>
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{n.notification_type.replaceAll("_", " ")}</p>
                <p className="text-xs text-neutral-500 mt-1">{n.full_name} · {new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => mark(n.id)} className="text-xs uppercase border border-neutral-600 px-2 py-1">Mark read</button>
              )}
            </div>
          </div>
        ))}
          {items.length === 0 && <p className="p-8 text-center text-sm text-neutral-500">You’re all caught up.</p>}
      </div>
    </div>
  );
}
