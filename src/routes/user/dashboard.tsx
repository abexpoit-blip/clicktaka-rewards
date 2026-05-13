import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DashboardSkeleton, ErrorState, EmptyState } from "@/components/ui-states";
import { LiveTicker } from "@/components/live-ticker";
import { Leaderboard } from "@/components/leaderboard";
import {
  Wallet, TrendingUp, Coins, Copy, Check, Target, Package, Activity,
  ArrowUpRight, ArrowDownRight, Calendar, Sparkles, Gift, Zap,
} from "lucide-react";

export const Route = createFileRoute("/user/dashboard")({ component: Dashboard });

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
  const [copied, setCopied] = useState(false);

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
  function copyRefer() {
    navigator.clipboard.writeText(u.refer_code);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <LiveTicker />

      {/* Hero — premium gradient with animated orbs */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand text-white shadow-brand">
        <div aria-hidden className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-float" />
        <div aria-hidden className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-primary-glow/40 blur-3xl" />
        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }} />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider font-semibold">
                <Sparkles className="h-3 w-3" /> Premium Member
              </div>
              <p className="mt-3 text-sm text-white/80">স্বাগতম 👋</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">{u.name || u.phone}</h1>
            </div>
            <button onClick={copyRefer}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2.5 text-sm font-medium transition border border-white/20">
              <Gift className="h-4 w-4" />
              <span className="font-mono tracking-wider">{u.refer_code}</span>
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 opacity-80" />}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <HeroStat icon={Wallet} label="Balance" value={`৳${Number(u.balance).toLocaleString()}`} accent />
            <HeroStat icon={TrendingUp} label="আজকের ইনকাম" value={`৳${d.earnings.today.toLocaleString()}`} />
            <HeroStat icon={Coins} label="মোট ইনকাম" value={`৳${d.earnings.total.toLocaleString()}`} />
          </div>
        </div>
      </section>

      {/* Quick stats — premium glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickCard icon={Target} tone="primary" label="এখনই করতে পারবেন" value={d.available_tasks} sub="Active task / ad" linkLabel="Tasks দেখুন" to="/user/tasks" />
        <QuickCard icon={Package} tone="info" label="Active Packages" value={pkgs.length} sub="Validity বাকি আছে" linkLabel="প্যাকেজ" to="/user/packages" />
        <QuickCard icon={Activity} tone="success" label="Recent Activity" value={d.recent_completions.length} sub="শেষ task complete" linkLabel="History" to="/user/history" />
      </div>

      {/* Active packages */}
      <section>
        <SectionTitle icon={Package} title="আপনার Active প্যাকেজ" />
        {pkgs.length === 0 ? (
          <EmptyState icon="📦" title="কোনো active package নেই" description="প্যাকেজ কিনে আজই income শুরু করুন।" action={{ label: "প্যাকেজ কিনুন", to: "/user/packages" }} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {pkgs.map((p) => {
              const pct = Math.min(100, Math.round((p.tasks_done_today / Math.max(1, p.daily_task_limit)) * 100));
              return (
                <div key={p.id} className="group relative rounded-2xl border border-border/70 bg-card p-5 shadow-card hover:shadow-brand transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground">{p.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Expires {new Date(p.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-success/10 text-success px-3 py-1.5 text-sm font-bold tabular-nums">
                      ৳{p.daily_earning}/day
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>আজকের progress</span>
                      <span className="font-semibold text-foreground tabular-nums">{p.tasks_done_today}/{p.daily_task_limit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent earnings */}
      <section>
        <SectionTitle icon={Zap} title="সাম্প্রতিক ইনকাম" />
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-card">
          {d.recent_completions.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm">এখনও কোনো task complete করেননি।</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {d.recent_completions.map((c) => (
                <li key={c.id} className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-accent/30 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-brand-soft text-primary shrink-0">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{c.type} • {new Date(c.completed_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-bold tabular-nums text-success shrink-0">+৳{Number(c.reward).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Leaderboard />

      {/* Transactions */}
      <section>
        <SectionTitle icon={Wallet} title="সাম্প্রতিক Transactions" />
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-card">
          {d.recent_transactions.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm">কোনো transaction নেই।</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {d.recent_transactions.map((t) => {
                const positive = Number(t.amount) >= 0;
                return (
                  <li key={t.id} className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-accent/30 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`grid place-items-center h-9 w-9 rounded-xl shrink-0 ${positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm capitalize">{t.type}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{t.note || '—'} • {new Date(t.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold tabular-nums shrink-0 ${positive ? 'text-success' : 'text-destructive'}`}>
                      {positive ? '+' : ''}৳{Number(t.amount).toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{className?: string}>; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3.5 border border-white/15 ${accent ? 'bg-white/15' : 'bg-white/5'} backdrop-blur`}>
      <div className="flex items-center gap-2 text-white/80">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-xl sm:text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function QuickCard({ icon: Icon, tone, label, value, sub, linkLabel, to }: {
  icon: React.ComponentType<{className?: string}>;
  tone: "primary" | "info" | "success";
  label: string; value: number | string; sub: string; linkLabel: string; to: string;
}) {
  const tones = {
    primary: "text-primary bg-primary/10",
    info: "text-info bg-info/10",
    success: "text-success bg-success/10",
  } as const;
  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-5 shadow-card hover:shadow-brand hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between">
        <span className={`grid place-items-center h-10 w-10 rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-4 font-display text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      <Link to={to} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
        {linkLabel} <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{className?: string}>; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-brand-soft text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}
