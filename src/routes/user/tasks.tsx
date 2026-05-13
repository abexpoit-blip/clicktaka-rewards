import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Target, Trophy, Zap, Lock, CheckCircle2, Play, Clock, X,
  TrendingUp, Crown, Flame, Coins, Package as PackageIcon, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/user/tasks")({ component: TasksPage });

type Task = { id: number; title: string; type: string; url: string | null; reward: number };
type Pkg = { id: number; name: string; tasks_done_today: number; daily_task_limit: number; daily_earning: number; expires_at: string };
type Data = {
  tasks: Task[];
  packages: Pkg[];
  completed_task_ids_today: number[];
  today_completed: number;
  daily_limit: number;
};

function TasksPage() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [active, setActive] = useState<{ task: Task; remaining: number } | null>(null);

  function load() {
    api<Data>("/user/tasks").then(setD).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  useEffect(() => {
    if (!active || active.remaining <= 0) return;
    const t = setTimeout(() => setActive((a) => (a ? { ...a, remaining: a.remaining - 1 } : a)), 1000);
    return () => clearTimeout(t);
  }, [active]);

  async function startTask(task: Task) {
    if (task.url) window.open(task.url, "_blank", "noopener");
    setActive({ task, remaining: 15 });
  }

  async function complete(task: Task) {
    setBusy(task.id);
    try {
      const r = await api<{ ok: boolean; reward: number }>(`/user/tasks/${task.id}/complete`, { method: "POST" });
      toast.success(`+৳${r.reward} যোগ হয়েছে 🎉`);
      setActive(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (err) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">{err}</div>;
  if (!d) return <DashboardSkeleton />;

  const done = new Set(d.completed_task_ids_today);
  const limitReached = d.daily_limit > 0 && d.today_completed >= d.daily_limit;
  const pct = d.daily_limit > 0 ? Math.min(100, Math.round((d.today_completed / d.daily_limit) * 100)) : 0;
  const noPackage = d.packages.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero progress card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand text-white shadow-brand p-6 sm:p-7">
        <div aria-hidden className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-float" />
        <div aria-hidden className="absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="relative">
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
              <p className="font-display text-5xl font-bold tabular-nums">{d.tasks.length}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="inline-flex items-center gap-1.5 font-semibold"><Target className="h-3.5 w-3.5" /> Daily Progress</span>
              <span className="tabular-nums font-bold">{d.today_completed} / {d.daily_limit || "—"}</span>
            </div>
            <div className="h-3 bg-white/15 rounded-full overflow-hidden backdrop-blur">
              <div className="h-full bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 rounded-full transition-all shadow-lg" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {noPackage && (
            <Link to="/user/packages" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white text-primary px-4 py-2.5 text-sm font-bold hover:scale-[1.02] transition shadow-2xl">
              <Crown className="h-4 w-4" /> Package নিন → আজই income শুরু করুন
            </Link>
          )}
        </div>
      </section>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={Target} label="Today Done" value={d.today_completed} tone="primary" />
        <StatTile icon={Trophy} label="Daily Limit" value={d.daily_limit || "—"} tone="warning" />
        <StatTile icon={Zap} label="Available" value={d.tasks.length} tone="info" />
        <StatTile icon={PackageIcon} label="Packages" value={d.packages.length} tone="success" />
      </div>

      {/* Active package breakdown */}
      {d.packages.length > 0 && (
        <section>
          <SectionTitle icon={PackageIcon} title="আপনার Active প্যাকেজ" />
          <div className="grid sm:grid-cols-2 gap-4">
            {d.packages.map((p) => {
              const ppct = Math.min(100, Math.round((p.tasks_done_today / Math.max(p.daily_task_limit, 1)) * 100));
              return (
                <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-card hover:shadow-brand transition-all">
                  <div aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-brand-soft" />
                  <div className="relative flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> Expires {new Date(p.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-xl bg-success/10 text-success px-3 py-1.5 text-sm font-bold tabular-nums shrink-0">৳{p.daily_earning}/day</span>
                  </div>
                  <div className="relative mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Tasks today</span>
                      <span className="font-semibold text-foreground tabular-nums">{p.tasks_done_today}/{p.daily_task_limit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-brand rounded-full transition-all" style={{ width: `${ppct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active running task — sticky modal-like */}
      {active && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 sm:pb-6 animate-fade-in">
          <div className="max-w-2xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 text-white shadow-2xl p-5 sm:p-6">
            <div aria-hidden className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
            <button onClick={() => setActive(null)} aria-label="Cancel" className="absolute top-3 right-3 grid place-items-center h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 transition">
              <X className="h-4 w-4" />
            </button>
            <div className="relative flex items-center gap-4">
              <div className="grid place-items-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur shrink-0">
                {active.remaining > 0 ? (
                  <span className="font-display text-2xl font-bold tabular-nums">{active.remaining}s</span>
                ) : (
                  <CheckCircle2 className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider font-bold text-white/80">▶ Task Running</p>
                <h3 className="font-display text-lg font-bold mt-0.5 truncate">{active.task.title}</h3>
                <p className="text-sm text-white/90">Reward: <b>৳{active.task.reward}</b></p>
              </div>
              {active.remaining <= 0 && (
                <button
                  onClick={() => complete(active.task)}
                  disabled={busy === active.task.id}
                  className="inline-flex items-center gap-1.5 px-5 py-3 bg-white text-emerald-600 rounded-xl font-bold hover:scale-[1.03] transition shadow-2xl disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" /> {busy === active.task.id ? "..." : "Claim"}
                </button>
              )}
            </div>
            {active.remaining > 0 && (
              <div className="relative mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${((15 - active.remaining) / 15) * 100}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available tasks */}
      <section>
        <SectionTitle icon={Zap} title="উপলব্ধ Task & Ad" right={
          <span className="text-xs text-muted-foreground">{d.tasks.length} টি available</span>
        } />
        {noPackage ? (
          <LockedTasks />
        ) : d.tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">এই মুহূর্তে কোনো task নেই। কিছুক্ষণ পর check করুন।</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {d.tasks.map((t, i) => {
              const isDone = done.has(t.id);
              const disabled = isDone || limitReached || active !== null;
              const accents = ["from-violet-500 to-fuchsia-500", "from-blue-500 to-cyan-500", "from-emerald-500 to-teal-500", "from-orange-500 to-pink-500", "from-rose-500 to-red-500"];
              const accent = accents[i % accents.length];
              return (
                <div key={t.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-card hover:shadow-brand hover:-translate-y-0.5 transition-all">
                  <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
                  <div className="flex items-center gap-3">
                    <div className={`grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br ${accent} text-white shrink-0 shadow`}>
                      {t.type === "ad" ? <ExternalLink className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">{t.type}</span>
                        <span className="inline-flex items-center gap-0.5 text-success font-bold">
                          <Coins className="h-3 w-3" /> +৳{t.reward}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => startTask(t)}
                      disabled={disabled}
                      className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        isDone
                          ? "bg-success/10 text-success"
                          : disabled
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-gradient-brand text-white shadow-brand hover:scale-105"
                      }`}
                    >
                      {isDone ? <><CheckCircle2 className="h-3.5 w-3.5" /> Done</> : limitReached ? "Limit" : <><Play className="h-3.5 w-3.5 fill-white" /> Start</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function LockedTasks() {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-brand-soft p-8 sm:p-10 text-center">
      <div className="grid place-items-center h-16 w-16 rounded-2xl bg-gradient-brand text-white mx-auto shadow-brand mb-4">
        <Lock className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold tracking-tight">Tasks Locked 🔒</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Tasks unlock করতে একটা package নিতে হবে। Silver থেকে শুরু — মাত্র ৳৫০০ এ দৈনিক ৳৭০ income!
      </p>
      <Link to="/user/packages" className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-gradient-brand text-white font-bold rounded-2xl shadow-brand hover:scale-[1.03] transition">
        <Crown className="h-4 w-4" /> Package দেখুন
      </Link>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{className?: string}>; label: string; value: number | string; tone: "primary"|"info"|"success"|"warning" }) {
  const tones = {
    primary: "from-violet-500/10 to-fuchsia-500/10 text-primary",
    info: "from-blue-500/10 to-cyan-500/10 text-info",
    success: "from-emerald-500/10 to-teal-500/10 text-success",
    warning: "from-amber-500/10 to-orange-500/10 text-warning",
  } as const;
  return (
    <div className={`rounded-2xl border border-border/70 bg-gradient-to-br ${tones[tone]} bg-card p-3.5`}>
      <Icon className="h-4 w-4" />
      <p className="font-display text-xl font-bold tabular-nums mt-1.5 text-foreground">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, right }: { icon: React.ComponentType<{className?: string}>; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-brand-soft text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 rounded-3xl bg-card" />
      <div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 rounded-2xl bg-card"/>)}</div>
      <div className="grid sm:grid-cols-2 gap-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-20 rounded-2xl bg-card"/>)}</div>
    </div>
  );
}
