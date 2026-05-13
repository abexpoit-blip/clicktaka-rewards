import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DashboardSkeleton, ErrorState, EmptyState } from "@/components/ui-states";
import { LiveTicker } from "@/components/live-ticker";
import { Leaderboard } from "@/components/leaderboard";

export const Route = createFileRoute("/_user/dashboard")({ component: Dashboard });

type Pkg = { id: number; name: string; expires_at: string; tasks_done_today: number; daily_task_limit: number; daily_earning: number };
type Completion = { id: number; reward: number; completed_at: string; title: string; type: string };
type Tx = { id: number; type: string; amount: number; balance_after: number | null; note: string | null; created_at: string };
type DashData = {
  user: { id: number; phone: string; name: string | null; balance: number; refer_code: string };
  available_tasks: number;
  earnings: { today: number; total: number };
  recent_completions: Completion[];
  recent_transactions: Tx[];
};

function Dashboard() {
  const [d, setD] = useState<DashData | null>(null);
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true); setErr("");
    Promise.all([
      api<DashData>("/user/dashboard").then(setD),
      api<{ packages: Pkg[] }>("/user/me").then((r) => setPkgs(r.packages || [])).catch(() => setPkgs([])),
    ]).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  if (err) return <ErrorState message={err} onRetry={load} />;
  if (loading || !d) return <DashboardSkeleton />;

  const u = d.user;
  return (
    <div className="space-y-6 animate-fade-in">
      <LiveTicker />
      {/* Balance hero */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-sm opacity-80">স্বাগতম</p>
        <h1 className="text-2xl font-bold">{u.name || u.phone}</h1>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Balance" value={`৳${Number(u.balance).toLocaleString()}`} />
          <Stat label="আজকের ইনকাম" value={`৳${d.earnings.today.toLocaleString()}`} />
          <Stat label="মোট ইনকাম" value={`৳${d.earnings.total.toLocaleString()}`} />
          <Stat label="Refer Code" value={u.refer_code} mono />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500">এখনই করতে পারবেন</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{d.available_tasks}</p>
          <p className="text-sm text-gray-600 mt-1">Active task/ad</p>
          <Link to="/user/tasks" className="inline-block mt-3 text-sm font-medium text-purple-600 hover:underline">Tasks দেখুন →</Link>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Active Packages</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{pkgs.length}</p>
          <p className="text-sm text-gray-600 mt-1">Validity বাকি আছে</p>
          <Link to="/user/packages" className="inline-block mt-3 text-sm font-medium text-blue-600 hover:underline">প্যাকেজ →</Link>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Recent Activity</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{d.recent_completions.length}</p>
          <p className="text-sm text-gray-600 mt-1">শেষ task complete</p>
          <Link to="/user/history" className="inline-block mt-3 text-sm font-medium text-green-600 hover:underline">History →</Link>
        </Card>
      </div>

      {/* Active packages */}
      <section>
        <h2 className="text-lg font-semibold mb-3">আপনার Active প্যাকেজ</h2>
        {pkgs.length === 0 ? (
          <EmptyState icon="📦" title="কোনো active package নেই" description="প্যাকেজ কিনে আজই income শুরু করুন।" action={{ label: "প্যাকেজ কিনুন", to: "/user/packages" }} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {pkgs.map((p) => (
              <Card key={p.id}>
                <h3 className="font-bold text-purple-600">{p.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Expires: {new Date(p.expires_at).toLocaleDateString()}</p>
                <p className="text-sm mt-2">আজকের progress: <b>{p.tasks_done_today}/{p.daily_task_limit}</b></p>
                <p className="text-sm">দৈনিক ইনকাম: <b className="text-green-600">৳{p.daily_earning}</b></p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent earnings */}
      <section>
        <h2 className="text-lg font-semibold mb-3">সাম্প্রতিক ইনকাম</h2>
        <Card noPad>
          {d.recent_completions.length === 0 ? (
            <p className="p-6 text-center text-gray-500">এখনও কোনো task complete করেননি।</p>
          ) : (
            <ul className="divide-y">
              {d.recent_completions.map((c) => (
                <li key={c.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.type} • {new Date(c.completed_at).toLocaleString()}</p>
                  </div>
                  <span className="text-green-600 font-bold">+৳{Number(c.reward).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Leaderboard />

      {/* Transactions */}
      <section>
        <h2 className="text-lg font-semibold mb-3">সাম্প্রতিক Transactions</h2>
        <Card noPad>
          {d.recent_transactions.length === 0 ? (
            <p className="p-6 text-center text-gray-500">কোনো transaction নেই।</p>
          ) : (
            <ul className="divide-y">
              {d.recent_transactions.map((t) => (
                <li key={t.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm capitalize">{t.type}</p>
                    <p className="text-xs text-gray-500">{t.note || '-'} • {new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`font-bold ${Number(t.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(t.amount) >= 0 ? '+' : ''}৳{Number(t.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs opacity-80">{label}</p>
      <p className={`text-xl font-bold ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
function Card({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return <div className={`bg-white rounded-xl shadow ${noPad ? '' : 'p-5'}`}>{children}</div>;
}
