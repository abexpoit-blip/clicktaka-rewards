import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { bumpBalance } from "@/lib/active-task";
import { toast } from "sonner";
import {
  Target, Trophy, Zap, Lock, CheckCircle2, Play, Clock, X, RotateCcw,
  TrendingUp, Crown, Flame, Coins, Package as PackageIcon, ExternalLink,
  Video, AppWindow, Share2, Gamepad2, Sparkles, ArrowRight,
} from "lucide-react";

const TYPE_META: Record<string, { icon: any; grad: string; label: string }> = {
  ad:     { icon: ExternalLink, grad: "from-violet-500 to-fuchsia-500",  label: "Sponsored Ad" },
  video:  { icon: Video,        grad: "from-rose-500 to-orange-500",     label: "Video Watch" },
  app:    { icon: AppWindow,    grad: "from-sky-500 to-cyan-500",        label: "App Install" },
  social: { icon: Share2,       grad: "from-emerald-500 to-teal-500",    label: "Social Action" },
  game:   { icon: Gamepad2,     grad: "from-amber-500 to-orange-600",    label: "Mini Game" },
};
function typeMeta(t: string) { return TYPE_META[t] || { icon: Target, grad: "from-slate-500 to-slate-700", label: t }; }

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
  const [justClaimed, setJustClaimed] = useState<{ id: number; reward: number } | null>(null);
  const REQUIRED_SECONDS = 30;
  const [active, setActive] = useState<{ task: Task; viewed: number; awayOnce: boolean; awayMs: number; needsAway: boolean } | null>(() => {
    // Resume from localStorage if user navigated here from dashboard / refreshed
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("ct_active_task_v1");
      if (!raw) return null;
      const v = JSON.parse(raw) as { id: number; startedAt: number; awayMs: number; needsAway: boolean };
      // We can't restore the full Task here without server data; defer until tasks load
      return null;
    } catch { return null; }
  });

  function load() {
    api<Data>("/user/tasks").then(setD).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  // After tasks load, resume an active task from localStorage if present
  useEffect(() => {
    if (!d || active) return;
    try {
      const raw = localStorage.getItem("ct_active_task_v1");
      if (!raw) return;
      const v = JSON.parse(raw) as { id: number; startedAt: number; awayMs: number; needsAway: boolean };
      const task = d.tasks.find((t) => t.id === v.id);
      if (!task) { localStorage.removeItem("ct_active_task_v1"); return; }
      const viewed = v.needsAway
        ? Math.min(REQUIRED_SECONDS, Math.floor(v.awayMs / 1000))
        : Math.min(REQUIRED_SECONDS, Math.floor((Date.now() - v.startedAt) / 1000));
      setActive({ task, viewed, awayOnce: v.awayMs > 0, awayMs: v.awayMs, needsAway: v.needsAway });
    } catch {}
  }, [d, active]);

  // Persist + notify dashboard whenever active changes
  useEffect(() => {
    try {
      if (!active) {
        localStorage.removeItem("ct_active_task_v1");
      } else {
        localStorage.setItem("ct_active_task_v1", JSON.stringify({
          id: active.task.id,
          startedAt: Date.now() - active.viewed * 1000,
          awayMs: active.awayMs,
          needsAway: active.needsAway,
        }));
      }
      window.dispatchEvent(new Event("ct:active-task"));
    } catch {}
  }, [active]);

  // Tick — for url-tasks count only when ClickTaka tab is hidden / blurred
  useEffect(() => {
    if (!active) return;
    if (active.viewed >= REQUIRED_SECONDS) return;
    const t = setInterval(() => {
      setActive((a) => {
        if (!a) return a;
        const isAway = document.hidden || !document.hasFocus();
        if (a.needsAway && !isAway) return a; // paused
        const viewed = Math.min(REQUIRED_SECONDS, a.viewed + 1);
        const awayMs = a.awayMs + (a.needsAway ? 1000 : 0);
        return { ...a, viewed, awayMs, awayOnce: a.awayOnce || isAway };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [active]);

  async function startTask(task: Task) {
    const needsAway = !!task.url;
    setActive({ task, viewed: 0, awayOnce: false, awayMs: 0, needsAway });
    if (task.url) {
      setTimeout(() => window.open(task.url!, "_blank", "noopener,noreferrer"), 50);
      toast.message("Ad খুলছে — কমপক্ষে 30s দেখুন, তারপর Claim চালু হবে", { duration: 3500 });
    }
  }

  async function complete(task: Task) {
    setBusy(task.id);
    try {
      const r = await api<{ ok: boolean; reward: number }>(`/user/tasks/${task.id}/complete`, { method: "POST" });
      // Optimistic balance bump for instant header update — no refresh needed
      bumpBalance(Number(r.reward));
      // Inline success state on the card before refetch
      setJustClaimed({ id: task.id, reward: Number(r.reward) });
      setActive(null);
      toast.success(`+৳${r.reward} যোগ হয়েছে 🎉`);
      // Refetch in background; clear success badge after a moment
      load();
      setTimeout(() => setJustClaimed((s) => (s?.id === task.id ? null : s)), 2500);
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

      {/* Active running task — sticky modal-like with verification */}
      {active && (() => {
        const remaining = Math.max(0, REQUIRED_SECONDS - active.viewed);
        const needsAway = !!active.task.url;
        const ready = remaining === 0 && (!needsAway || active.awayOnce);
        const pctDone = Math.round((active.viewed / REQUIRED_SECONDS) * 100);
        return (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 sm:pb-6 animate-fade-in">
          <div className="max-w-2xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 text-white shadow-2xl p-5 sm:p-6">
            <div aria-hidden className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
            <button onClick={() => setActive(null)} aria-label="Cancel" className="absolute top-3 right-3 grid place-items-center h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 transition">
              <X className="h-4 w-4" />
            </button>
            <div className="relative flex items-center gap-4">
              <div className="grid place-items-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur shrink-0">
                {!ready ? (
                  <span className="font-display text-2xl font-bold tabular-nums">{remaining}s</span>
                ) : (
                  <CheckCircle2 className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider font-bold text-white/80">▶ Verifying View</p>
                <h3 className="font-display text-lg font-bold mt-0.5 truncate">{active.task.title}</h3>
                <p className="text-sm text-white/90">
                  Reward: <b>৳{active.task.reward}</b>
                  {needsAway && !active.awayOnce && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      ⚠ Ad tab খুলুন
                    </span>
                  )}
                </p>
              </div>
              {ready ? (
                <button
                  onClick={() => complete(active.task)}
                  disabled={busy === active.task.id}
                  className="inline-flex items-center gap-1.5 px-5 py-3 bg-white text-emerald-600 rounded-xl font-bold hover:scale-[1.03] transition shadow-2xl disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" /> {busy === active.task.id ? "..." : "Claim"}
                </button>
              ) : (
                <div className="text-right text-[11px] text-white/85 max-w-[120px]">
                  {needsAway && !active.awayOnce ? "Ad tab-এ যান" : "Verify হচ্ছে…"}
                </div>
              )}
            </div>
            <div className="relative mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pctDone}%` }} />
            </div>
            <div className="relative mt-2 flex items-center justify-between gap-2 text-[11px] text-white/85 leading-relaxed">
              <p className="flex-1">
                {needsAway
                  ? "🛡️ Ad tab-এ যান ও কমপক্ষে 30s দেখুন। ফিরে আসলে timer pause হবে।"
                  : "⏱ কমপক্ষে 30 সেকেন্ড অপেক্ষা করুন।"}
              </p>
              <button
                type="button"
                onClick={() => { setActive(null); toast.message("Active task reset হয়েছে — আবার Start করুন"); }}
                className="inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-2.5 py-1 font-bold uppercase tracking-wider transition shrink-0"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          </div>
        </div>
        );
      })()}

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
          <>
            {/* Today Potential bar */}
            <div className="mb-4 rounded-2xl border border-border/70 bg-gradient-brand-soft p-4 flex items-center gap-4 flex-wrap">
              <div className="grid place-items-center h-11 w-11 rounded-2xl bg-gradient-brand text-white shadow-brand shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Today's Potential</p>
                <p className="font-display text-xl sm:text-2xl font-bold tabular-nums">
                  ৳{d.tasks.reduce((s, t) => s + Number(t.reward || 0), 0).toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-2">এই মুহূর্তে claim-able</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Available</p>
                <p className="font-display text-2xl font-bold tabular-nums text-primary">{d.tasks.length}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {d.tasks.map((t) => {
                const isDone = done.has(t.id);
                const disabled = isDone || limitReached || active !== null;
                const m = typeMeta(t.type);
                const Icon = m.icon;
                return (
                  <article key={t.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card hover:shadow-brand hover:-translate-y-0.5 transition-all">
                    <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.grad}`} />
                    {isDone && (
                      <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-success/15 text-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </span>
                    )}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br ${m.grad} text-white shrink-0 shadow-lg`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{m.label}</p>
                          <h3 className="font-display font-bold text-base mt-0.5 line-clamp-2">{t.title}</h3>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-success/10 text-success py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider opacity-80">Reward</p>
                          <p className="font-display font-bold tabular-nums text-base">+৳{Number(t.reward).toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl bg-info/10 text-info py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider opacity-80">Duration</p>
                          <p className="font-display font-bold tabular-nums text-base">~30s</p>
                        </div>
                      </div>

                      <button
                        onClick={() => startTask(t)}
                        disabled={disabled}
                        className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                          isDone
                            ? "bg-success/10 text-success cursor-default"
                            : limitReached
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : disabled
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : `bg-gradient-to-r ${m.grad} text-white shadow-brand hover:scale-[1.02]`
                        }`}
                      >
                        {isDone ? <><CheckCircle2 className="h-4 w-4" /> Done</>
                          : limitReached ? <>Daily Limit শেষ</>
                          : <><Play className="h-4 w-4 fill-white" /> Start &amp; Earn <ArrowRight className="h-3.5 w-3.5" /></>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
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
