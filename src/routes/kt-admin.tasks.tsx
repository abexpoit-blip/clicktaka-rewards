import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { TaskTitle } from "@/lib/package-badge";
import {
  Sparkles, Plus, Search, Target, AppWindow, Share2, Gamepad2,
  ExternalLink, Pause, Play, Trash2, Coins, Activity, TrendingUp, Filter,
  CheckCircle2, Zap, Layers, UserPlus, ClipboardList, MonitorPlay, Megaphone,
  Pencil, X, PackageCheck,
} from "lucide-react";

export const Route = createFileRoute("/kt-admin/tasks")({ component: AdminTasks });

type T = {
  id: number; title: string; description: string | null; type: string;
  url: string | null; reward: number; active: number; created_at: string;
  completions: number; package_ids: number[];
};
type Pkg = { id: number; name: string; price: number };

const TYPE_META: Record<string, { icon: any; grad: string; chip: string; label: string }> = {
  signup: { icon: UserPlus,    grad: "from-indigo-500 to-blue-600",     chip: "bg-indigo-100 text-indigo-700", label: "Signup" },
  ad:     { icon: Megaphone,   grad: "from-violet-500 to-fuchsia-500",  chip: "bg-violet-100 text-violet-700", label: "Ad Watch" },
  video:  { icon: MonitorPlay, grad: "from-rose-500 to-orange-500",     chip: "bg-rose-100 text-rose-700",     label: "Video Watch" },
  survey: { icon: ClipboardList, grad: "from-cyan-500 to-blue-500",     chip: "bg-cyan-100 text-cyan-700",     label: "Survey" },
  app:    { icon: AppWindow,   grad: "from-sky-500 to-cyan-500",        chip: "bg-sky-100 text-sky-700",       label: "App Install" },
  social: { icon: Share2,      grad: "from-emerald-500 to-teal-500",    chip: "bg-emerald-100 text-emerald-700", label: "Social" },
  game:   { icon: Gamepad2,    grad: "from-amber-500 to-orange-600",    chip: "bg-amber-100 text-amber-800",   label: "Game" },
};
const ALL_TYPES = ["signup", "ad", "video", "survey", "app", "social", "game"] as const;
function meta(t: string) { return TYPE_META[t] || { icon: Target, grad: "from-slate-500 to-slate-700", chip: "bg-slate-100 text-slate-700", label: t }; }

type FormState = {
  id: number | null;
  title: string;
  description: string;
  type: string;
  url: string;
  reward: string;
  package_ids: number[]; // empty = all packages
};
const EMPTY_FORM: FormState = { id: null, title: "", description: "", type: "ad", url: "", reward: "1", package_ids: [] };

function AdminTasks() {
  const [tasks, setTasks] = useState<T[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [pkgFilter, setPkgFilter] = useState<number | "all" | "none">("all");

  function load() {
    setLoading(true);
    Promise.all([
      api<{ tasks: T[] }>("/admin/tasks"),
      api<{ packages: Pkg[] }>("/admin/packages").catch(() => ({ packages: [] })),
    ]).then(([t, p]) => { setTasks(t.tasks); setPackages(p.packages); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function resetForm() { setForm(EMPTY_FORM); setErr(""); }
  function startEdit(t: T) {
    setForm({
      id: t.id, title: t.title, description: t.description || "",
      type: t.type, url: t.url || "", reward: String(t.reward),
      package_ids: t.package_ids || [],
    });
    setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description.trim() || null,
        type: form.type,
        url: form.url,
        reward: Number(form.reward),
        active: true,
        package_ids: form.package_ids,
      };
      if (form.id) {
        await api(`/admin/tasks/${form.id}`, { method: "PUT", json: payload });
        toast.success("Task updated ✨");
      } else {
        await api("/admin/tasks", { method: "POST", json: payload });
        toast.success("Task created ✨");
      }
      resetForm(); load();
    } catch (e: any) { setErr(e.message); toast.error(e.message); }
    finally { setBusy(false); }
  }
  async function toggle(id: number) {
    await api(`/admin/tasks/${id}/toggle`, { method: "POST" });
    toast.success("Status updated"); load();
  }
  async function del(id: number) {
    if (!confirm(`Task #${id} delete করবেন?`)) return;
    try { await api(`/admin/tasks/${id}`, { method: "DELETE" }); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  function togglePkg(pid: number) {
    setForm((f) => ({
      ...f,
      package_ids: f.package_ids.includes(pid)
        ? f.package_ids.filter((x) => x !== pid)
        : [...f.package_ids, pid],
    }));
  }
  function selectAllPkgs() { setForm((f) => ({ ...f, package_ids: packages.map((p) => p.id) })); }
  function clearPkgs() { setForm((f) => ({ ...f, package_ids: [] })); }

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
      if (pkgFilter === "none" && t.package_ids.length !== 0) return false;
      if (typeof pkgFilter === "number" && !t.package_ids.includes(pkgFilter)) return false;
      if (q && !(`${t.title} ${t.description || ""} ${t.type} ${t.url ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [tasks, q, filter, pkgFilter]);

  const pkgName = (id: number) => packages.find((p) => p.id === id)?.name || `#${id}`;

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
            <p className="mt-1 text-white/85 text-sm">নতুন task তৈরি করুন, package target করুন, live performance দেখুন।</p>
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

      {/* Create / Edit form */}
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-8 w-8 rounded-xl bg-gradient-brand text-white shadow-brand">
              {form.id ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </span>
            <h2 className="font-display text-base font-bold tracking-tight">
              {form.id ? `Edit Task #${form.id}` : "New Task / Ad"}
            </h2>
          </div>
          {form.id && (
            <button onClick={resetForm} className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white">
              <X className="h-3.5 w-3.5" /> Cancel edit
            </button>
          )}
        </header>
        <form onSubmit={submit} className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-4">
          <Field className="sm:col-span-7" label="Title">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              placeholder="Watch promo video"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition" />
          </Field>
          <Field className="sm:col-span-3" label="Reward (৳)">
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              <input type="number" step="0.01" min="0" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm font-bold tabular-nums text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition" />
            </div>
          </Field>
          <div className="sm:col-span-2 flex flex-col justify-end">
            <button disabled={busy} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-brand text-white rounded-xl text-sm font-bold shadow-brand hover:scale-[1.02] transition disabled:opacity-60">
              {form.id ? <><Pencil className="h-4 w-4" /> {busy ? "..." : "Save"}</> : <><Plus className="h-4 w-4" /> {busy ? "..." : "Add"}</>}
            </button>
          </div>

          <Field className="sm:col-span-12" label="Description (user-এর কাছে দেখাবে)">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="যেমন: 30 সেকেন্ড ad দেখুন এবং ৳5 পান"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition resize-none" />
          </Field>

          <Field className="sm:col-span-12" label="Type — icon + label">
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {ALL_TYPES.map((tp) => {
                const m = meta(tp); const Icon = m.icon; const sel = form.type === tp;
                return (
                  <button type="button" key={tp} onClick={() => setForm({ ...form, type: tp })}
                    className={`relative flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition ${sel ? `bg-gradient-to-br ${m.grad} text-white border-transparent shadow-brand scale-[1.02]` : "border-white/10 bg-slate-950/40 text-slate-400 hover:text-white hover:border-fuchsia-400/40"}`}>
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field className="sm:col-span-12" label="URL (optional)">
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/landing"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition" />
            </div>
          </Field>

          {/* Package targeting — bulk + single select */}
          <Field className="sm:col-span-12" label={
            <span className="flex items-center justify-between">
              <span>Available for packages</span>
              <span className="flex items-center gap-2 normal-case tracking-normal">
                <button type="button" onClick={selectAllPkgs} className="text-[10px] font-bold text-fuchsia-300 hover:text-white">All</button>
                <span className="text-slate-600">·</span>
                <button type="button" onClick={clearPkgs} className="text-[10px] font-bold text-slate-400 hover:text-white">None</button>
              </span>
            </span>
          }>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-2">
              {packages.length === 0 ? (
                <p className="text-xs text-slate-500 px-2 py-2">No packages found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {packages.map((p) => {
                    const sel = form.package_ids.includes(p.id);
                    return (
                      <button type="button" key={p.id} onClick={() => togglePkg(p.id)}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition ${sel ? "bg-gradient-brand text-white border-transparent shadow-brand" : "border-white/10 bg-slate-900/50 text-slate-300 hover:border-fuchsia-400/40 hover:text-white"}`}>
                        <span className="truncate">{p.name}</span>
                        <span className={`tabular-nums text-[10px] ${sel ? "text-white/85" : "text-slate-500"}`}>৳{p.price}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-2 px-1 text-[10px] text-slate-400">
                {form.package_ids.length === 0
                  ? "👉 কিছু select না করলে: সব active package এর user দেখতে পাবে।"
                  : `Selected ${form.package_ids.length} / ${packages.length} — শুধু এই package-এর user-রা দেখবে।`}
              </p>
            </div>
            {err && <p className="text-destructive text-xs mt-1.5">{err}</p>}
          </Field>
        </form>
      </section>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title / type / URL দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400/50 transition" />
        </div>
        <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/60 p-1 shadow-xl">
          <Filter className="h-4 w-4 text-slate-400 mx-2" />
          {([["all","All"],["active","Active"],["paused","Paused"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === k ? "bg-gradient-brand text-white shadow-brand" : "text-slate-400 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Package filter chips — package-base separation */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-3 shadow-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 pl-2 pr-1">
            <PackageCheck className="h-3.5 w-3.5 text-fuchsia-300" /> Package
          </span>
          <button onClick={() => setPkgFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${pkgFilter === "all" ? "bg-gradient-brand text-white shadow-brand" : "bg-slate-950/40 text-slate-300 hover:text-white border border-white/10"}`}>
            All ({tasks.length})
          </button>
          <button onClick={() => setPkgFilter("none")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${pkgFilter === "none" ? "bg-emerald-500 text-white shadow-brand" : "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20"}`}>
            Common ({tasks.filter(t => t.package_ids.length === 0).length})
          </button>
          {packages.map((p) => {
            const cnt = tasks.filter((t) => t.package_ids.includes(p.id)).length;
            const sel = pkgFilter === p.id;
            return (
              <button key={p.id} onClick={() => setPkgFilter(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${sel ? "bg-gradient-brand text-white shadow-brand" : "bg-slate-950/40 text-slate-300 hover:text-white border border-white/10"}`}>
                <span>{p.name}</span>
                <span className={`tabular-nums text-[10px] px-1.5 rounded ${sel ? "bg-white/20" : "bg-fuchsia-500/15 text-fuchsia-200"}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 px-2 text-[10px] text-slate-400">
          💡 প্রতিটা package-এর tasks আলাদা করে দেখতে এখান থেকে select করুন। <span className="text-emerald-300 font-bold">Common</span> = সব package-এর user এর জন্য available।
        </p>
      </div>

      {/* Tasks grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-slate-900/60" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-white/15 bg-slate-900/40 p-12 text-center">
          <div className="grid place-items-center h-14 w-14 rounded-2xl bg-gradient-brand-soft text-primary mx-auto mb-3">
            <Zap className="h-6 w-6" />
          </div>
          <p className="font-display font-semibold">কোনো task পাওয়া যায়নি</p>
          <p className="text-sm text-slate-400 mt-1">উপরের form ব্যবহার করে নতুন task যোগ করুন।</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((t) => {
            const m = meta(t.type); const Icon = m.icon;
            return (
              <article key={t.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur shadow-xl hover:border-fuchsia-400/40 hover:shadow-fuchsia-500/20 hover:-translate-y-0.5 transition-all">
                <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.grad}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br ${m.grad} text-white shadow-lg shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.chip}`}>
                          <Icon className="h-3 w-3" /> {m.label}
                        </span>
                        <span className="text-[10px] text-slate-400">#{t.id}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${t.active ? "bg-success/15 text-success" : "bg-muted text-slate-400"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${t.active ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                          {t.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base mt-1.5 line-clamp-2 text-white">{t.title}</h3>
                      {t.description && (
                        <p className="text-xs text-slate-300/80 mt-1 line-clamp-2">{t.description}</p>
                      )}
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

                  <div className="mt-3 rounded-xl bg-slate-950/40 border border-white/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <PackageCheck className="h-3 w-3" /> Packages
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.package_ids.length === 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">All packages</span>
                      ) : (
                        t.package_ids.map((pid) => (
                          <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-200 font-semibold">
                            {pkgName(pid)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(t)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-primary/15 text-primary hover:bg-primary/25 transition">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => toggle(t.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${t.active ? "bg-warning/15 text-warning hover:bg-warning/25" : "bg-success/15 text-success hover:bg-success/25"}`}>
                      {t.active ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Activate</>}
                    </button>
                    <button onClick={() => del(t.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition">
                      <Trash2 className="h-3.5 w-3.5" />
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

function Field({ label, children, className = "" }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">{label}</label>
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
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-4 shadow-xl hover:border-fuchsia-400/40 transition">
      <div className="flex items-center justify-between">
        <span className={`grid place-items-center h-9 w-9 rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
        <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}
