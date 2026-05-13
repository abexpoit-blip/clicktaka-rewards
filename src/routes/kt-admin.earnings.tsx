import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/kt-admin/earnings")({ component: AdminEarnings });

type E = { id: number; reward: number; completed_at: string; user_id: number; phone: string; name: string | null; task_title: string; task_type: string };

function AdminEarnings() {
  const [rows, setRows] = useState<E[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ earnings: E[] }>("/admin/earnings?limit=200")
      .then((r) => setRows(r.earnings))
      .finally(() => setLoading(false));
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.reward), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Earnings (Task Completions)</h1>
        <div className="text-sm text-slate-300">দেখানো হচ্ছে: <b className="text-green-400">৳{total.toLocaleString()}</b> ({rows.length} entries)</div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? <p className="p-6 text-center text-slate-400">লোডিং...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50 text-slate-300">
                <tr>
                  <th className="text-left px-3 py-2">When</th>
                  <th className="text-left px-3 py-2">User</th>
                  <th className="text-left px-3 py-2">Task</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-right px-3 py-2">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 text-xs text-slate-400">{new Date(e.completed_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{e.name || e.phone} <span className="text-xs text-slate-500">#{e.user_id}</span></td>
                    <td className="px-3 py-2">{e.task_title}</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-slate-700 text-xs">{e.task_type}</span></td>
                    <td className="px-3 py-2 text-right text-green-400 font-semibold">৳{Number(e.reward).toFixed(2)}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">এখনও কোনো task complete হয়নি।</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
