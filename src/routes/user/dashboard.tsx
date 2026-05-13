import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DashboardSkeleton, ErrorState, EmptyState } from "@/components/ui-states";
import { LiveTicker } from "@/components/live-ticker";
import { Leaderboard } from "@/components/leaderboard";
import {
  Wallet, TrendingUp, Coins, Target, Package, Activity,
  ArrowUpRight, ArrowDownRight, Sparkles, Zap, Crown, Flame,
  Trophy, Rocket, Shield, Star, Play, ArrowRight, Calendar, Award, BadgeCheck,
  ExternalLink, Video, AppWindow, Share2, Gamepad2,
} from "lucide-react";

const TASK_TYPE: Record<string, { icon: any; grad: string; label: string }> = {
  ad:     { icon: ExternalLink, grad: "from-violet-500 to-fuchsia-500", label: "Sponsored Ad" },
  video:  { icon: Video,        grad: "from-rose-500 to-orange-500",    label: "Video Watch" },
  app:    { icon: AppWindow,    grad: "from-sky-500 to-cyan-500",       label: "App Install" },
  social: { icon: Share2,       grad: "from-emerald-500 to-teal-500",   label: "Social Action" },
  game:   { icon: Gamepad2,     grad: "from-amber-500 to-orange-600",   label: "Mini Game" },
};

export const Route = createFileRoute("/user/dashboard")({ component: Dashboard });

type Pkg = { id: number; name: string; expires_at: string; tasks_done_today: number; daily_task_limit: number; daily_earning: number };
type Completion = { id: number; reward: number; completed_at: string; title: string; type: string };
type Tx = { id: number; type: string; amount: number; balance_after: number | null; note: string | null; created_at: string };
type Task = { id: number; title: string; type: string; url: string | null; reward: number };
type TaskData = { tasks: Task[]; today_completed: number; daily_limit: number; completed_task_ids_today?: number[] };
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
  const [tdata, setTdata] = useState<TaskData | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true); setErr("");
    Promise.all([
      api<DashData>("/user/dashboard").then(setD),
      api<{ packages: Pkg[] }>("/user/me").then((r) => setPkgs(r.packages || [])).catch(() => setPkgs([])),
      api<TaskData>("/user/tasks").then(setTdata).catch(() => setTdata(null)),
    ]).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  if (err) return <ErrorState message={err} onRetry={load} />;
  if (loading || !d) return <DashboardSkeleton />;

  const noPackage = pkgs.length === 0;
  const todayDone = tdata?.today_completed ?? 0;
  const dailyLimit = tdata?.daily_limit ?? 0;
  const availableTasks = tdata?.tasks ?? [];
  const taskCount = availableTasks.length || d.available_tasks;
  const pct = dailyLimit > 0 ? Math.min(100, Math.round((todayDone / dailyLimit) * 100)) : 0;
  const potential = availableTasks.reduce((s, t) => s + Number(t.reward || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <LiveTicker />

      {/* Today's Mission — task-focused hero (replaces old profile hero) */}
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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider font-bold">
                <Flame className="h-3 w-3" /> Today's Mission
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mt-3 tracking-tight">
                আজকের <span className="shimmer-text">Earning</span> শুরু করুন
              </h1>
              <p className="mt-1 text-white/85 text-sm">প্রতিটা task complete = সরাসরি Balance-এ টাকা যোগ ✨</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-white/70">Available Now</p>
              <p className="font-display text-5xl font-bold tabular-nums">{taskCount}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="inline-flex items-center gap-1.5 font-semibold"><Target className="h-3.5 w-3.5" /> Daily Progress</span>
              <span className="tabular-nums font-bold">{todayDone} / {dailyLimit || "—"}</span>
            </div>
            <div className="h-3 bg-white/15 rounded-full overflow-hidden backdrop-blur">
              <div className="h-full bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 rounded-full transition-all shadow-lg" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Today's potential + CTA */}
          <div className="mt-5 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div className="rounded-2xl bg-white/12 backdrop-blur border border-white/15 px-4 py-3 flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-white/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Today's Potential</p>
                <p className="font-display text-xl font-bold tabular-nums">৳{potential.toLocaleString()} <span className="text-[11px] font-normal text-white/75">claim-able</span></p>
              </div>
            </div>
            {noPackage ? (
              <Link to="/user/packages" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-primary px-5 py-3 text-sm font-bold hover:scale-[1.03] transition shadow-2xl whitespace-nowrap">
                <Crown className="h-4 w-4" /> Package নিন
              </Link>
            ) : (
              <Link to="/user/tasks" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-primary px-5 py-3 text-sm font-bold hover:scale-[1.03] transition shadow-2xl whitespace-nowrap">
                <Play className="h-4 w-4 fill-primary" /> Start Earning <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Today's task preview — 3-5 quick tasks with live progress */}
      {availableTasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-brand text-white shadow-brand">
                <Zap className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">আজকের Quick Tasks</h2>
            </div>
            <Link to="/user/tasks" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableTasks.slice(0, 5).map((t) => (
              <QuickTaskCard
                key={t.id}
                task={t}
                done={(tdata?.completed_task_ids_today || []).includes(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick stats — premium glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickCard icon={Target} tone="primary" label="এখনই করতে পারবেন" value={d.available_tasks} sub="Active task / ad" linkLabel="Tasks দেখুন" to="/user/tasks" />
        <QuickCard icon={Package} tone="info" label="Active Packages" value={pkgs.length} sub="Validity বাকি আছে" linkLabel="প্যাকেজ" to="/user/packages" />
        <QuickCard icon={Activity} tone="success" label="Recent Activity" value={d.recent_completions.length} sub="শেষ task complete" linkLabel="History" to="/user/history" />
      </div>

      {/* Achievement strip — premium gamification */}
      <AchievementStrip totalEarned={d.earnings.total} completions={d.recent_completions.length} hasPkg={pkgs.length > 0} />

      {/* Upgrade CTA — eye-catching, drives package purchase */}
      {pkgs.length === 0 ? (
        <UpgradeBanner />
      ) : (
        <EarnMoreBanner pkgs={pkgs} />
      )}

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

function UpgradeBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-brand text-white shadow-brand p-6 sm:p-8">
      <div aria-hidden className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-float" />
      <div aria-hidden className="absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-primary-glow/40 blur-3xl" />
      <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider font-bold">
            <Sparkles className="h-3 w-3" /> Unlock Earnings
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-3 tracking-tight">
            🔒 আপনার আয় শুরু হবে — Package activate করার পরই
          </h2>
          <p className="mt-2 text-white/85 text-sm sm:text-base max-w-xl">
            একটা package নিন, প্রতিদিন <b>৭০ — ১৩০০ টাকা</b> পর্যন্ত আয় করুন। বিকাশ/নগদে instant withdraw। কোনো ঝামেলা নেই।
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Chip>✓ ৩৬৫ দিন valid</Chip>
            <Chip>✓ Daily guaranteed income</Chip>
            <Chip>✓ Refer commission ১০%</Chip>
            <Chip>✓ Spin & bonus reward</Chip>
          </div>
        </div>
        <Link to="/user/packages" className="group inline-flex items-center gap-2 px-6 py-3.5 bg-white text-primary font-bold rounded-2xl shadow-2xl hover:scale-[1.03] transition whitespace-nowrap">
          <Crown className="h-4 w-4" /> Upgrade এখনই <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>
    </section>
  );
}

function EarnMoreBanner({ pkgs }: { pkgs: Pkg[] }) {
  const totalDaily = pkgs.reduce((s, p) => s + Number(p.daily_earning || 0), 0);
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-card">
      <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
        <div className="flex items-center gap-4">
          <div className="grid place-items-center h-14 w-14 rounded-2xl bg-gradient-brand text-white shadow-brand shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">আজকের earning potential</p>
            <p className="font-display text-2xl font-bold mt-0.5">
              ৳<span className="tabular-nums">{totalDaily.toLocaleString()}</span> <span className="text-sm font-normal text-muted-foreground">আজ আনলক করুন</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Tasks complete করুন এবং আজই reward নিন।</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/user/packages" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold hover:border-primary/40 transition">
            <Crown className="h-4 w-4 text-primary" /> Upgrade
          </Link>
          <Link to="/user/tasks" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold shadow-brand hover:scale-[1.02] transition">
            <Zap className="h-4 w-4" /> Start Earning
          </Link>
        </div>
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 font-medium">{children}</span>;
}

function AchievementStrip({ totalEarned, completions, hasPkg }: { totalEarned: number; completions: number; hasPkg: boolean }) {
  const tiers = [
    { name: "Rookie",  min: 0,     icon: Shield,  grad: "from-slate-400 to-slate-600" },
    { name: "Hustler", min: 500,   icon: Rocket,  grad: "from-emerald-500 to-teal-500" },
    { name: "Pro",     min: 2500,  icon: Star,    grad: "from-sky-500 to-indigo-500" },
    { name: "Elite",   min: 10000, icon: Trophy,  grad: "from-amber-400 to-orange-500" },
    { name: "Legend",  min: 50000, icon: Crown,   grad: "from-fuchsia-500 to-purple-600" },
  ];
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) if (totalEarned >= tiers[i].min) idx = i;
  const cur = tiers[idx];
  const next = tiers[Math.min(idx + 1, tiers.length - 1)];
  const isMax = idx === tiers.length - 1;
  const span = Math.max(1, next.min - cur.min);
  const pct = isMax ? 100 : Math.max(4, Math.min(100, Math.round(((totalEarned - cur.min) / span) * 100)));
  const CurIcon = cur.icon;

  return (
    <section className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
      <div className="grid md:grid-cols-[auto_1fr_auto] gap-5 items-center p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className={`relative grid place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br ${cur.grad} text-white shadow-brand`}>
            <CurIcon className="h-7 w-7" />
            <span className="absolute -bottom-1 -right-1 grid place-items-center h-6 w-6 rounded-full bg-white text-foreground text-[10px] font-bold border border-border">L{idx + 1}</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Your Tier</p>
            <p className="font-display text-xl font-bold">{cur.name}</p>
            <p className="text-[11px] text-muted-foreground">{completions} task complete</p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold inline-flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" /> Progress to <b>{isMax ? cur.name : next.name}</b></span>
            <span className="tabular-nums font-bold">৳{totalEarned.toLocaleString()}{!isMax && <span className="text-muted-foreground"> / ৳{next.min.toLocaleString()}</span>}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
            <div className={`h-full bg-gradient-to-r ${cur.grad} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tiers.map((t, i) => {
              const TIcon = t.icon; const reached = i <= idx;
              return (
                <span key={t.name} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${reached ? `bg-gradient-to-r ${t.grad} text-white` : "bg-muted text-muted-foreground"}`}>
                  <TIcon className="h-2.5 w-2.5" /> {t.name}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex md:flex-col gap-2 md:items-end">
          <Link to={hasPkg ? "/user/tasks" : "/user/packages"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-brand text-white px-4 py-2.5 text-xs font-bold shadow-brand hover:scale-[1.03] transition whitespace-nowrap">
            {hasPkg ? <><Zap className="h-3.5 w-3.5" /> Earn More</> : <><Crown className="h-3.5 w-3.5" /> Unlock</>}
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5 text-success" /> Verified Account
          </span>
        </div>
      </div>
    </section>
  );
}
