import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Phone, Wallet, Hash, Copy, Check, Shield, LogOut,
  ArrowDownCircle, ArrowUpCircle, Send, Sparkles, Calendar, Star,
  TrendingUp, Award, BadgeCheck, Activity, Clock, Crown, Banknote,
  Share2, ChevronRight, Package as PackageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { TaskTitle } from "@/lib/package-badge";

export const Route = createFileRoute("/user/profile")({ component: ProfilePage });

type User = { id: number; phone: string; name: string | null; balance: number; refer_code: string; created_at?: string; total_earned?: number };
type Tx = { id: number; type: string; amount: number; balance_after: number | null; note: string | null; created_at: string };
type Pkg = { id: number; name: string; expires_at: string };
type Completion = { id: number; reward: number; completed_at: string; title: string; type: string };

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ user: User; packages?: Pkg[] }>("/user/me"),
      api<{ transactions: Tx[] }>("/user/transactions").catch(() => ({ transactions: [] as Tx[] })),
      api<{ recent_completions: Completion[] }>("/user/dashboard").catch(() => ({ recent_completions: [] as Completion[] })),
    ])
      .then(([u, t, d]) => {
        setUser(u.user);
        setPkgs(u.packages || []);
        setTxs(t.transactions || []);
        setCompletions(d.recent_completions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  function copyCode() {
    navigator.clipboard.writeText(user?.refer_code || "").then(() => {
      setCopied(true); toast.success("Refer code কপি হয়েছে");
      setTimeout(() => setCopied(false), 1500);
    });
  }
  async function shareRefer() {
    const url = `${window.location.origin}/register?ref=${user?.refer_code || ""}`;
    const text = `ClickTaka তে join করো এবং দৈনিক ৳৭০ — ৳১৩০০ আয় করো! আমার refer code: ${user?.refer_code} \n${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "ClickTaka", text, url }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Referral link কপি হয়েছে");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>;
  }
  if (!user) return null;

  const initials = (user.name || user.phone).slice(0, 2).toUpperCase();
  const totalIn = txs.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = txs.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const isActive = pkgs.length > 0;
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-6">
      {/* Hero profile card — mobile-first */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand text-white shadow-brand">
        <div aria-hidden className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-float" />
        <div aria-hidden className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="relative p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-amber-300 to-rose-400 grid place-items-center text-xl sm:text-2xl font-bold text-white shadow-xl ring-4 ring-white/20">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 grid place-items-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-emerald-400 text-emerald-900 ring-2 ring-white">
                <BadgeCheck className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">
                <Sparkles className="h-2.5 w-2.5" /> Verified Member
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold mt-1.5 truncate">{user.name || "ClickTaka User"}</h1>
              <p className="text-xs sm:text-sm text-white/85 flex items-center gap-1.5 mt-0.5"><Phone className="h-3 w-3" /> {user.phone}</p>
              <p className="text-[10px] text-white/70 inline-flex items-center gap-1 mt-0.5"><Calendar className="h-2.5 w-2.5" /> Member since {memberSince}</p>
            </div>
          </div>

          {/* Balance + ID grid — 2 cols on mobile */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-2xl bg-white/15 backdrop-blur p-3 border border-white/20">
              <p className="text-[10px] uppercase tracking-wider text-white/70 inline-flex items-center gap-1"><Wallet className="h-3 w-3" /> Balance</p>
              <p className="font-display text-xl sm:text-2xl font-bold tabular-nums mt-0.5">৳{Number(user.balance).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur p-3 border border-white/20">
              <p className="text-[10px] uppercase tracking-wider text-white/70 inline-flex items-center gap-1"><Banknote className="h-3 w-3" /> Total Earned</p>
              <p className="font-display text-xl sm:text-2xl font-bold tabular-nums mt-0.5">৳{Number(user.total_earned ?? totalIn).toLocaleString()}</p>
            </div>
          </div>

          {/* Status pill */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${isActive ? "bg-emerald-400 text-emerald-950" : "bg-white/20 text-white"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-700" : "bg-white"} animate-pulse`} /> {isActive ? "Active Account" : "Free Account"}
            </span>
            {isActive && <span className="text-[11px] text-white/80 inline-flex items-center gap-1"><PackageIcon className="h-3 w-3" /> {pkgs.length} package</span>}
            {!isActive && (
              <Link to="/user/packages" className="inline-flex items-center gap-1 rounded-full bg-white text-primary px-3 py-1 text-[11px] font-bold hover:scale-[1.03] transition">
                <Crown className="h-3 w-3" /> Activate
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Quick actions — 4 cols mobile */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <QuickAction href="/user/deposit" icon={ArrowDownCircle} label="Deposit" grad="from-emerald-500 to-teal-500" />
        <QuickAction href="/user/withdraw" icon={ArrowUpCircle} label="Withdraw" grad="from-rose-500 to-pink-500" />
        <QuickAction href="/user/refer" icon={Send} label="Refer" grad="from-violet-500 to-fuchsia-500" />
        <QuickAction href="/user/packages" icon={Crown} label="Upgrade" grad="from-amber-500 to-orange-500" />
      </div>

      {/* Referral card — eye-catching */}
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-brand-soft p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-11 w-11 rounded-2xl bg-gradient-brand text-white shadow-brand shrink-0">
            <Hash className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Your Referral Code</p>
            <p className="font-mono font-bold text-xl sm:text-2xl text-primary tracking-widest">{user.refer_code}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={copyCode} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-card border border-border px-3 py-2.5 text-xs font-bold hover:border-primary/40 transition">
            {copied ? <><Check className="h-3.5 w-3.5 text-success" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy Code</>}
          </button>
          <button onClick={shareRefer} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-brand text-white px-3 py-2.5 text-xs font-bold shadow-brand hover:scale-[1.02] transition">
            <Share2 className="h-3.5 w-3.5" /> Share &amp; Earn
          </button>
        </div>
      </section>

      {/* Stats grid — 2 cols mobile */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <StatCard icon={TrendingUp} tone="success" label="মোট Income" value={`+৳${totalIn.toFixed(0)}`} />
        <StatCard icon={ArrowUpCircle} tone="warning" label="মোট খরচ" value={`-৳${totalOut.toFixed(0)}`} />
        <StatCard icon={Award} tone="primary" label="Tasks Done" value={completions.length} />
        <StatCard icon={PackageIcon} tone="info" label="Active Packages" value={pkgs.length} />
      </div>

      {/* Recent activity — task completions */}
      <section className="rounded-3xl bg-card border border-border/70 overflow-hidden shadow-card">
        <header className="px-4 sm:px-5 py-3 border-b border-border/60 flex items-center justify-between bg-gradient-brand-soft">
          <h3 className="font-display font-bold text-foreground inline-flex items-center gap-2 text-sm sm:text-base">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-brand text-white shadow-brand"><Activity className="h-3.5 w-3.5" /></span>
            সাম্প্রতিক Activity
          </h3>
          <Link to="/user/history" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-0.5">
            All <ChevronRight className="h-3 w-3" />
          </Link>
        </header>
        {completions.length === 0 ? (
          <div className="p-8 text-center">
            <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">এখনও কোনো task complete হয়নি</p>
            <Link to="/user/tasks" className="inline-flex items-center gap-1 mt-3 rounded-xl bg-gradient-brand text-white px-4 py-2 text-xs font-bold shadow-brand">
              Tasks শুরু করুন →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {completions.slice(0, 6).map((c) => (
              <li key={c.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-brand-soft text-primary shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <TaskTitle title={c.title} className="text-sm font-semibold" badgeSize="xs" />
                  <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {new Date(c.completed_at).toLocaleString("bn-BD")}</p>
                </div>
                <p className="text-sm font-bold tabular-nums text-success shrink-0">+৳{Number(c.reward).toFixed(2)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent transactions */}
      <section className="rounded-3xl bg-card border border-border/70 overflow-hidden shadow-card">
        <header className="px-4 sm:px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-display font-bold inline-flex items-center gap-2 text-sm sm:text-base">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-brand-soft text-primary"><Wallet className="h-3.5 w-3.5" /></span>
            Transactions
          </h3>
          <Link to="/user/history" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-0.5">
            All <ChevronRight className="h-3 w-3" />
          </Link>
        </header>
        {txs.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">কোনো transaction নেই</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {txs.slice(0, 6).map((t) => {
              const amt = Number(t.amount);
              const isIn = amt >= 0;
              return (
                <li key={t.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                  <div className={`grid place-items-center h-9 w-9 rounded-xl shrink-0 ${isIn ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {isIn ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold capitalize truncate">{t.type}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{t.note || new Date(t.created_at).toLocaleString("bn-BD")}</p>
                  </div>
                  <p className={`text-sm font-bold tabular-nums shrink-0 ${isIn ? "text-success" : "text-destructive"}`}>
                    {isIn ? "+" : ""}৳{amt.toFixed(2)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button
        onClick={async () => { await api("/auth/logout", { method: "POST" }).catch(() => {}); window.location.href = "/login"; }}
        className="w-full rounded-2xl bg-card border-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground py-3 font-bold flex items-center justify-center gap-2 transition"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, grad }: { href: string; icon: any; label: string; grad: string }) {
  return (
    <Link to={href} className="group rounded-2xl bg-card border border-border/70 p-3 shadow-card hover:shadow-brand hover:-translate-y-0.5 transition text-center">
      <div className={`mx-auto grid place-items-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${grad} text-white shadow-md group-hover:scale-110 transition`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-1.5 text-[11px] sm:text-xs font-bold text-foreground">{label}</p>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone: "primary" | "success" | "warning" | "info" }) {
  const tones = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/15",
    info: "text-info bg-info/10",
  } as const;
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 sm:p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className={`grid place-items-center h-8 w-8 rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold text-right">{label}</p>
      </div>
      <p className="mt-2 font-display text-lg sm:text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
