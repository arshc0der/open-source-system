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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white uppercase tracking-widest mb-8">Notifications</h1>
      {error && <p className="text-red-400 font-mono text-sm">{error}</p>}
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className={`border p-4 ${n.is_read ? "border-neutral-900 text-neutral-500" : "border-neutral-700 text-white"}`}>
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm font-mono uppercase">{n.notification_type}</p>
                <p className="text-xs text-neutral-500 mt-1">{n.full_name}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => mark(n.id)} className="text-xs uppercase border border-neutral-600 px-2 py-1">Mark read</button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-neutral-500">No notifications yet.</p>}
      </div>
    </div>
  );
}
