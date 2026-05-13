import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ErrorState, Skeleton } from "@/components/ui-states";

export const Route = createFileRoute("/kt-admin/dashboard")({ component: AdminDashboard });

type Stats = {
  users: { total: number; active: number; blocked: number };
  earnings: { total_paid_out: number };
  deposits_pending: { count: number; amount: number };
  withdrawals_pending: { count: number; amount: number };
  tasks: { total: number; active: number };
  completions: { total: number; today: number };
};
type EarningRow = { id: number; reward: number; completed_at: string; user_id: number; phone: string; name: string | null; task_title: string; task_type: string };

function AdminDashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true); setErr("");
    Promise.all([
      api<Stats>("/admin/stats").then(setS),
      api<{ earnings: EarningRow[] }>("/admin/earnings?limit=20").then((r) => setEarnings(r.earnings)).catch(() => setEarnings([])),
    ]).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  if (err) return <ErrorState dark message={err} onRetry={load} />;
  if (loading || !s) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Overview</h1>
      </div>

      <DeployPanel />

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="মোট Users" value={s.users.total} sub={`${s.users.active} active · ${s.users.blocked} blocked`} color="purple" />
        <StatCard label="Active Tasks" value={s.tasks.active} sub={`${s.tasks.total} total`} color="blue" />
        <StatCard label="আজ Complete" value={s.completions.today} sub={`${s.completions.total} all-time`} color="green" />
        <StatCard label="মোট Paid Out" value={`৳${s.earnings.total_paid_out.toLocaleString()}`} sub="Task earnings" color="amber" />
        <StatCard label="Pending Deposits" value={s.deposits_pending.count} sub={`৳${s.deposits_pending.amount.toLocaleString()}`} color="cyan" />
        <StatCard label="Pending Withdrawals" value={s.withdrawals_pending.count} sub={`৳${s.withdrawals_pending.amount.toLocaleString()}`} color="rose" />
        <StatCard label="Blocked Users" value={s.users.blocked} sub="Review needed" color="red" />
        <StatCard label="Total Completions" value={s.completions.total} sub="All time" color="indigo" />
      </div>

      {/* Recent earnings */}
      <section>
        <h2 className="text-lg font-semibold mb-3">সাম্প্রতিক Task Earnings</h2>
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {earnings.length === 0 ? (
            <p className="p-6 text-center text-slate-400">এখনও কোনো task complete হয়নি।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 text-slate-300">
                  <tr>
                    <th className="text-left px-4 py-2">User</th>
                    <th className="text-left px-4 py-2">Task</th>
                    <th className="text-left px-4 py-2">Type</th>
                    <th className="text-right px-4 py-2">Reward</th>
                    <th className="text-right px-4 py-2">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {earnings.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-2">{e.name || e.phone} <span className="text-xs text-slate-400">#{e.user_id}</span></td>
                      <td className="px-4 py-2">{e.task_title}</td>
                      <td className="px-4 py-2"><span className="px-2 py-0.5 rounded bg-slate-700 text-xs">{e.task_type}</span></td>
                      <td className="px-4 py-2 text-right text-green-400 font-semibold">৳{Number(e.reward).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-slate-400 text-xs">{new Date(e.completed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    purple: "from-purple-500/20 to-purple-700/10 border-purple-500/30 text-purple-300",
    blue: "from-blue-500/20 to-blue-700/10 border-blue-500/30 text-blue-300",
    green: "from-green-500/20 to-green-700/10 border-green-500/30 text-green-300",
    amber: "from-amber-500/20 to-amber-700/10 border-amber-500/30 text-amber-300",
    cyan: "from-cyan-500/20 to-cyan-700/10 border-cyan-500/30 text-cyan-300",
    rose: "from-rose-500/20 to-rose-700/10 border-rose-500/30 text-rose-300",
    red: "from-red-500/20 to-red-700/10 border-red-500/30 text-red-300",
    indigo: "from-indigo-500/20 to-indigo-700/10 border-indigo-500/30 text-indigo-300",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1 text-white">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}
