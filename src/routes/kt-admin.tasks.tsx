import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/kt-admin/tasks")({ component: AdminTasks });

type T = { id: number; title: string; type: string; url: string | null; reward: number; active: number; created_at: string; completions: number };

function AdminTasks() {
  const [tasks, setTasks] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", type: "ad", url: "", reward: "1" });
  const [err, setErr] = useState("");

  function load() {
    setLoading(true);
    api<{ tasks: T[] }>("/admin/tasks").then((r) => setTasks(r.tasks)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try {
      await api("/admin/tasks", { method: "POST", json: { ...form, reward: Number(form.reward), active: true } });
      setForm({ title: "", type: "ad", url: "", reward: "1" }); load();
    } catch (e: any) { setErr(e.message); }
  }
  async function toggle(id: number) {
    await api(`/admin/tasks/${id}/toggle`, { method: "POST" }); load();
  }
  async function del(id: number) {
    if (!confirm(`Task #${id} delete করবেন?`)) return;
    try { await api(`/admin/tasks/${id}`, { method: "DELETE" }); load(); }
    catch (e: any) { alert(e.message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks / Ads</h1>

      <form onSubmit={create} className="bg-slate-800 border border-slate-700 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400">Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm">
            <option value="ad">Ad</option><option value="video">Video</option>
            <option value="app">App</option><option value="social">Social</option><option value="game">Game</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Reward (৳)</label>
          <input type="number" step="0.01" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} required
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
        </div>
        <button className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium">+ Add Task</button>
        <div className="sm:col-span-5">
          <label className="text-xs text-slate-400">URL (optional)</label>
          <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..."
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
          {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
        </div>
      </form>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? <p className="p-6 text-center text-slate-400">লোডিং...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50 text-slate-300">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-right px-3 py-2">Reward</th>
                  <th className="text-right px-3 py-2">Completions</th>
                  <th className="text-center px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 text-slate-400">#{t.id}</td>
                    <td className="px-3 py-2">
                      <p>{t.title}</p>
                      {t.url && <a href={t.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block max-w-xs">{t.url}</a>}
                    </td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-slate-700 text-xs">{t.type}</span></td>
                    <td className="px-3 py-2 text-right text-green-400">৳{Number(t.reward).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{t.completions}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${t.active ? 'bg-green-600/30 text-green-300' : 'bg-slate-600/40 text-slate-300'}`}>
                        {t.active ? 'active' : 'paused'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button onClick={() => toggle(t.id)} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 mr-1">
                        {t.active ? 'Pause' : 'Activate'}
                      </button>
                      <button onClick={() => del(t.id)} className="text-xs px-2 py-1 rounded bg-red-600/30 text-red-300 hover:bg-red-600/50">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-400">কোনো task নেই। উপরে যোগ করুন।</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
