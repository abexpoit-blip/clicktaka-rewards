import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Sparkles, Plus, Search, Target, Video, AppWindow, Share2, Gamepad2,
  ExternalLink, Pause, Play, Trash2, Coins, Activity, TrendingUp, Filter,
  CheckCircle2, Zap, Layers,
} from "lucide-react";

export const Route = createFileRoute("/kt-admin/tasks")({ component: AdminTasks });

type T = { id: number; title: string; type: string; url: string | null; reward: number; active: number; created_at: string; completions: number };

const TYPE_META: Record<string, { icon: any; grad: string; chip: string }> = {
  ad:     { icon: ExternalLink, grad: "from-violet-500 to-fuchsia-500",  chip: "bg-violet-100 text-violet-700" },
  video:  { icon: Video,        grad: "from-rose-500 to-orange-500",     chip: "bg-rose-100 text-rose-700" },
  app:    { icon: AppWindow,    grad: "from-sky-500 to-cyan-500",        chip: "bg-sky-100 text-sky-700" },
  social: { icon: Share2,       grad: "from-emerald-500 to-teal-500",    chip: "bg-emerald-100 text-emerald-700" },
  game:   { icon: Gamepad2,     grad: "from-amber-500 to-orange-600",    chip: "bg-amber-100 text-amber-800" },
};
function meta(t: string) { return TYPE_META[t] || { icon: Target, grad: "from-slate-500 to-slate-700", chip: "bg-slate-100 text-slate-700" }; }

function AdminTasks() {
  const [tasks, setTasks] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", type: "ad", url: "", reward: "1" });
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  function load() {
    setLoading(true);
    api<{ tasks: T[] }>("/admin/tasks").then((r) => setTasks(r.tasks)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setCreating(true);
    try {
      await api("/admin/tasks", { method: "POST", json: { ...form, reward: Number(form.reward), active: true } });
      toast.success("Task created ✨");
      setForm({ title: "", type: "ad", url: "", reward: "1" }); load();
    } catch (e: any) { setErr(e.message); toast.error(e.message); }
    finally { setCreating(false); }
  }
  async function toggle(id: number) {
    await api(`/admin/tasks/${id}/toggle`, { method: "POST" });
    toast.success("Status updated");
    load();
  }
  async function del(id: number) {
    if (!confirm(`Task #${id} delete করবেন?`)) return;
    try { await api(`/admin/tasks/${id}`, { method: "DELETE" }); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  const stats = useMemo(() => {
    const active = tasks.filter((t) => t.active).length;
    const totalCompletions = tasks.reduce((s, t) => s + (t.completions || 0), 0);
    const totalPaid = tasks.reduce((s, t) => s + (t.completions || 0) * Number(t.reward || 0), 0);
    return { total: tasks.length, active, paused: tasks.length - active, totalCompletions, totalPaid };
  }, [tasks]);

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === "active" && !t.active) return false;
      if (filter === "paused" && t.active) return false;
      if (q && !(`${t.title} ${t.type} ${t.url ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [tasks, q, filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand text-white shadow-brand p-6 sm:p-7">
        <div aria-hidden className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-float" />
        <div aria-hidden className="absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider font-bold">
              <Sparkles className="h-3 w-3" /> Task Studio
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-3">Tasks &amp; Ads Manager</h1>
            <p className="mt-1 text-white/85 text-sm">নতুন task তৈরি করুন, reward সেট করুন, এবং live performance দেখুন।</p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[280px]">
            <HeroStat icon={Layers} label="Total" value={stats.total} />
            <HeroStat icon={Activity} label="Active" value={stats.active} />
            <HeroStat icon={TrendingUp} label="Done" value={stats.totalCompletions} />
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi icon={Layers} tone="primary" label="Total Tasks" value={stats.total} />
        <Kpi icon={CheckCircle2} tone="success" label="Active" value={stats.active} />
        <Kpi icon={Pause} tone="warning" label="Paused" value={stats.paused} />
        <Kpi icon={Coins} tone="info" label="Reward Paid" value={`৳${stats.totalPaid.toLocaleString()}`} />
      </div>

      {/* Create form */}
      <section className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-brand-soft px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-8 w-8 rounded-xl bg-gradient-brand text-white shadow-brand"><Plus className="h-4 w-4" /></span>
            <h2 className="font-display text-base font-bold tracking-tight">New Task / Ad</h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">দ্রুত publish করুন → User-এর কাছে instantly visible হবে।</span>
        </header>
        <form onSubmit={create} className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-4">
          <Field className="sm:col-span-5" label="Title">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              placeholder="Watch promo video"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition" />
          </Field>
          <Field className="sm:col-span-3" label="Type">
            <div className="grid grid-cols-5 gap-1.5">
              {(["ad","video","app","social","game"] as const).map((tp) => {
                const m = meta(tp); const Icon = m.icon; const sel = form.type === tp;
                return (
                  <button type="button" key={tp} onClick={() => setForm({ ...form, type: tp })}
                    aria-label={tp}
                    className={`relative grid place-items-center aspect-square rounded-xl border transition ${sel ? `bg-gradient-to-br ${m.grad} text-white border-transparent shadow-brand scale-[1.02]` : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"}`}>
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </Field>
          <Field className="sm:col-span-2" label="Reward (৳)">
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              <input type="number" step="0.01" min="0" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm font-bold tabular-nums text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition" />
            </div>
          </Field>
          <div className="sm:col-span-2 flex flex-col justify-end">
            <button disabled={creating} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-brand text-white rounded-xl text-sm font-bold shadow-brand hover:scale-[1.02] transition disabled:opacity-60">
              <Plus className="h-4 w-4" /> {creating ? "..." : "Add Task"}
            </button>
          </div>
          <Field className="sm:col-span-12" label="URL (optional)">
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/landing"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition" />
            </div>
            {err && <p className="text-destructive text-xs mt-1.5">{err}</p>}
          </Field>
        </form>
      </section>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title / type / URL দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition" />
        </div>
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
          <Filter className="h-4 w-4 text-muted-foreground mx-2" />
          {([["all","All"],["active","Active"],["paused","Paused"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === k ? "bg-gradient-brand text-white shadow-brand" : "text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-card" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card/60 p-12 text-center">
          <div className="grid place-items-center h-14 w-14 rounded-2xl bg-gradient-brand-soft text-primary mx-auto mb-3">
            <Zap className="h-6 w-6" />
          </div>
          <p className="font-display font-semibold">কোনো task পাওয়া যায়নি</p>
          <p className="text-sm text-muted-foreground mt-1">উপরের form ব্যবহার করে নতুন task যোগ করুন।</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((t) => {
            const m = meta(t.type); const Icon = m.icon;
            return (
              <article key={t.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card hover:shadow-brand hover:-translate-y-0.5 transition-all">
                <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.grad}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br ${m.grad} text-white shadow-lg shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.chip}`}>{t.type}</span>
                        <span className="text-[10px] text-muted-foreground">#{t.id}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${t.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${t.active ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                          {t.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base mt-1.5 line-clamp-2">{t.title}</h3>
                      {t.url && (
                        <a href={t.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1 truncate max-w-full">
                          <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{t.url}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-success/10 text-success py-2">
                      <p className="text-[10px] uppercase tracking-wider opacity-80">Reward</p>
                      <p className="font-display font-bold tabular-nums text-base">৳{Number(t.reward).toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-info/10 text-info py-2">
                      <p className="text-[10px] uppercase tracking-wider opacity-80">Completions</p>
                      <p className="font-display font-bold tabular-nums text-base">{t.completions}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => toggle(t.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${t.active ? "bg-warning/15 text-warning hover:bg-warning/25" : "bg-success/15 text-success hover:bg-success/25"}`}>
                      {t.active ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Activate</>}
                    </button>
                    <button onClick={() => del(t.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 p-3">
      <div className="flex items-center gap-1.5 text-white/80">
        <Icon className="h-3 w-3" /> <p className="text-[10px] uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-display text-xl font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone: "primary" | "success" | "warning" | "info" }) {
  const tones = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/15",
    info:    "text-info bg-info/10",
  } as const;
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card hover:shadow-brand transition">
      <div className="flex items-center justify-between">
        <span className={`grid place-items-center h-9 w-9 rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
