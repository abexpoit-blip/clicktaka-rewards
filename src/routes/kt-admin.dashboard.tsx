import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ErrorState, Skeleton } from "@/components/ui-states";
import { TaskTitle } from "@/lib/package-badge";
import {
  Users, UserCheck, UserX, Target, CheckCircle2, Wallet, ArrowDownCircle,
  ArrowUpCircle, TrendingUp, Activity, GitBranch, Clock, RefreshCw, Server,
  ChevronRight, Zap,
} from "lucide-react";

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
      api<{ earnings: EarningRow[] }>("/admin/earnings?limit=15").then((r) => setEarnings(r.earnings)).catch(() => setEarnings([])),
    ]).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  if (err) return <ErrorState dark message={err} onRetry={load} />;
  if (loading || !s) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const pendingTotal = s.deposits_pending.count + s.withdrawals_pending.count;

  return (
    <div className="space-y-6">
      {/* Hero KPI */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium text-white">
              <Activity className="h-3.5 w-3.5" /> Admin Console · Live
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">Welcome back, Admin</h1>
            <p className="mt-1 text-sm text-white/70">আজকের overview এবং pending কাজগুলো এক নজরে।</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:min-w-[420px]">
            <HeroStat label="মোট Paid" value={`৳${(s.earnings.total_paid_out / 1000).toFixed(1)}k`} />
            <HeroStat label="Today Tasks" value={s.completions.today} />
            <HeroStat label="Pending" value={pendingTotal} accent={pendingTotal > 0} />
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      {(s.deposits_pending.count > 0 || s.withdrawals_pending.count > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          <ActionCard
            href="/kt-admin/payments"
            tone="emerald"
            icon={ArrowDownCircle}
            title={`${s.deposits_pending.count} Pending Deposits`}
            sub={`৳${s.deposits_pending.amount.toLocaleString()} approve waiting`}
          />
          <ActionCard
            href="/kt-admin/payments"
            tone="rose"
            icon={ArrowUpCircle}
            title={`${s.withdrawals_pending.count} Pending Withdrawals`}
            sub={`৳${s.withdrawals_pending.amount.toLocaleString()} payout queue`}
          />
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="মোট Users" value={s.users.total} sub={`${s.users.active} active`} from="from-violet-500" to="to-purple-600" />
        <KpiCard icon={UserCheck} label="Active" value={s.users.active} sub="logged-in users" from="from-emerald-500" to="to-teal-600" />
        <KpiCard icon={UserX} label="Blocked" value={s.users.blocked} sub="review needed" from="from-rose-500" to="to-red-600" />
        <KpiCard icon={Target} label="Active Tasks" value={s.tasks.active} sub={`${s.tasks.total} total`} from="from-blue-500" to="to-cyan-600" />
        <KpiCard icon={CheckCircle2} label="Today Done" value={s.completions.today} sub={`${s.completions.total} all-time`} from="from-amber-500" to="to-orange-600" />
        <KpiCard icon={Wallet} label="Total Paid Out" value={`৳${s.earnings.total_paid_out.toLocaleString()}`} sub="task earnings" from="from-fuchsia-500" to="to-pink-600" />
        <KpiCard icon={ArrowDownCircle} label="Pending Dep" value={s.deposits_pending.count} sub={`৳${s.deposits_pending.amount.toLocaleString()}`} from="from-cyan-500" to="to-sky-600" />
        <KpiCard icon={ArrowUpCircle} label="Pending Wd" value={s.withdrawals_pending.count} sub={`৳${s.withdrawals_pending.amount.toLocaleString()}`} from="from-indigo-500" to="to-violet-600" />
      </div>

      {/* Recent earnings + Deploy */}
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" /> সাম্প্রতিক Earnings
            </h2>
            <Link to="/kt-admin/earnings" className="text-xs font-semibold text-violet-300 hover:text-violet-200 flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/80 overflow-hidden">
            {earnings.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">এখনও কোনো task complete হয়নি।</p>
            ) : (
              <ul className="divide-y divide-slate-700/60">
                {earnings.map((e) => (
                  <li key={e.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition">
                    <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold shrink-0">
                      {(e.name || e.phone)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{e.name || e.phone} <span className="text-xs text-slate-500">#{e.user_id}</span></p>
                      <p className="text-xs text-slate-400 truncate"><TaskTitle title={e.task_title} badgeSize="xs" /> · <span className="capitalize">{e.task_type}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400 tabular-nums">+৳{Number(e.reward).toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">{new Date(e.completed_at).toLocaleTimeString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <DeployPanel />
      </div>
    </div>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl backdrop-blur p-3 border ${accent ? "bg-amber-300/20 border-amber-300/40" : "bg-white/10 border-white/20"}`}>
      <p className="text-[10px] uppercase tracking-wider text-white/70">{label}</p>
      <p className="text-xl font-bold text-white tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, from, to }: { icon: any; label: string; value: number | string; sub?: string; from: string; to: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/70 backdrop-blur border border-slate-700/80 p-4 hover:border-slate-600 transition">
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${from} ${to} opacity-20 blur-2xl group-hover:opacity-30 transition`} />
      <div className={`relative inline-grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br ${from} ${to} text-white shadow-lg`}>
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <p className="relative mt-3 text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="relative text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="relative text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ActionCard({ href, tone, icon: Icon, title, sub }: { href: string; tone: "emerald" | "rose"; icon: any; title: string; sub: string }) {
  const tones = {
    emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300",
    rose: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-300",
  } as const;
  return (
    <Link to={href} className={`group rounded-2xl bg-gradient-to-br ${tones[tone]} border p-4 flex items-center gap-3 hover:scale-[1.01] transition`}>
      <div className="grid place-items-center h-12 w-12 rounded-xl bg-slate-900/40 border border-white/10">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs opacity-80">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-1 transition" />
    </Link>
  );
}

type DeployInfo = {
  commit: string | null; full_commit: string | null; branch: string | null;
  message: string | null; author: string | null; commit_time: string | null;
  deployed_at: string | null; server_time: string | null; uptime_sec: number;
};

function DeployPanel() {
  const [d, setD] = useState<DeployInfo | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  function load() {
    setLoading(true); setErr("");
    api<DeployInfo>("/admin/deploy-info").then(setD).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);
  const fmt = (s: string | null) => s ? new Date(s).toLocaleString() : "—";
  const uptime = (sec: number) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  return (
    <section className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <Server className="h-4 w-4 text-slate-300" /> Server Status
        </h2>
        <button onClick={load} className="text-xs px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 inline-flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : err ? (
        <p className="text-xs text-rose-400">{err}</p>
      ) : d ? (
        <div className="space-y-2">
          <Field icon={GitBranch} label="Branch" value={d.branch || "—"} mono accent />
          <Field icon={Zap} label="Commit" value={d.commit || "—"} mono />
          <Field icon={Clock} label="Deployed" value={fmt(d.deployed_at)} />
          <Field icon={Activity} label="Uptime" value={uptime(d.uptime_sec)} accent />
          {d.message && (
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/60 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Last commit</p>
              <p className="text-xs text-slate-200 mt-0.5 line-clamp-2">{d.message}</p>
              {d.author && <p className="text-[10px] text-slate-500 mt-1">by {d.author}</p>}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Field({ icon: Icon, label, value, mono, accent }: { icon: any; label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-700/60 p-2.5">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${accent ? "text-emerald-400" : "text-slate-400"}`} />
      <span className="text-[10px] uppercase tracking-wider text-slate-500 w-16 shrink-0">{label}</span>
      <span className={`text-xs text-slate-100 truncate flex-1 ${mono ? "font-mono" : ""}`} title={value}>{value}</span>
    </div>
  );
}
