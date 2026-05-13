import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LiveTicker } from "@/components/live-ticker";
import { Reviews } from "@/components/reviews";
import { BrandsMarquee } from "@/components/brands-marquee";
import {
  Banknote, Rocket, ShieldCheck, Zap, Users, Wallet, Target, Crown,
  CheckCircle2, ArrowRight, TrendingUp, Smartphone, Sparkles,
} from "lucide-react";

type Pkg = { id: number; name: string; price: number; daily_task_limit: number; daily_earning: number };
type ActivePkg = { id: number; name: string; daily_task_limit: number; daily_earning: number; expires_at?: string };
type Me = { user: { id: number; phone: string }; packages: ActivePkg[] };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClickTaka — দৈনিক টাকা আয় করুন | Bangladesh #1 Earning Site" },
      { name: "description", content: "ক্লিক করে, অ্যাড দেখে, গেম খেলে দৈনিক ৫০ থেকে ১৩০০ টাকা পর্যন্ত আয় করুন। বিকাশ/নগদে instant withdraw।" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    api<{ packages: Pkg[] }>("/packages")
      .then((d) => setPackages(d.packages))
      .catch(() => {});
    api<Me>("/user/me")
      .then((d) => { setMe(d); setAuthed(true); })
      .catch(() => setAuthed(false));
  }, []);

  const activePkgPrice = (() => {
    if (!me?.packages?.length || !packages.length) return 0;
    const names = new Set(me.packages.map((p) => p.name));
    const matched = packages.filter((p) => names.has(p.name));
    return matched.reduce((m, p) => Math.max(m, Number(p.price)), 0);
  })();

  return (
    <div className="min-h-screen grid-noise">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-brand shadow-brand">
              <Banknote className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl font-bold text-gradient-brand">ClickTaka</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/40 rounded-xl transition">Login</Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-brand text-white rounded-xl shadow-brand hover:opacity-95 transition">
              Register <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 backdrop-blur px-3 py-1 text-xs font-semibold">
            🇧🇩 <span>Bangladesh-এর #1 Trusted Earning Platform</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-5 leading-[1.05] tracking-tight">
            দৈনিক <span className="text-gradient-brand">৫০ — ১৩০০ টাকা</span><br />
            ঘরে বসে <span className="relative inline-block">
              ইনকাম
              <svg aria-hidden viewBox="0 0 200 12" className="absolute left-0 -bottom-2 w-full h-2.5 text-primary/60">
                <path d="M2 8 Q 50 2 100 6 T 198 5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span> করুন
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Task complete করে, অ্যাড দেখে, গেম খেলে — সরাসরি <b className="text-pink-600">বিকাশ</b> / <b className="text-orange-600">নগদে</b> instant withdraw। কোনো hidden charge নেই।
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-brand text-white font-semibold rounded-2xl shadow-brand hover:scale-[1.02] transition">
              <Rocket className="h-4 w-4" /> এখনই Free Account খুলুন
            </Link>
            <Link to="#packages" className="inline-flex items-center gap-2 px-7 py-3.5 bg-card text-foreground font-semibold rounded-2xl border border-border hover:border-primary/40 transition">
              প্যাকেজ দেখুন
            </Link>
          </div>

          {/* Hero stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <HeroStat icon={Users} label="Active User" value="৫৩,২৬৯+" />
            <HeroStat icon={Wallet} label="Total Paid" value="৳৭,৩২,০০০+" />
            <HeroStat icon={Zap} label="Avg Withdraw" value="১০ মিনিট" />
            <HeroStat icon={ShieldCheck} label="Trust Score" value="৪.৫ / ৫.০" />
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Feature icon={Zap} title="Instant Withdraw" desc="বিকাশ/নগদে ১০ মিনিটে টাকা পান। কোনো wait নেই।" tone="warning" />
          <Feature icon={ShieldCheck} title="১০০% Safe & Secure" desc="২ বছর ধরে চলছে, ২ কোটি+ payout সম্পন্ন।" tone="success" />
          <Feature icon={Smartphone} title="Mobile Friendly" desc="শুধু ফোন আর internet — কোনো laptop লাগবে না।" tone="info" />
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-brand-soft px-3 py-1 text-xs font-semibold text-primary">
            <Crown className="h-3.5 w-3.5" /> Investment Packages
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 tracking-tight">
            আমাদের <span className="text-gradient-brand">প্যাকেজসমূহ</span>
          </h2>
          <p className="text-muted-foreground mt-2">যত বড় প্যাকেজ — তত বেশি দৈনিক ইনকাম 🚀</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {packages.length === 0 && (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-card animate-pulse border border-border/60" />
            ))
          )}
          {packages.map((p, i) => {
            const featured = i === Math.min(2, packages.length - 1);
            const price = Number(p.price);
            const isActive = activePkgPrice > 0 && price === activePkgPrice;
            const isUpgrade = activePkgPrice > 0 && price > activePkgPrice;
            const isLower = activePkgPrice > 0 && price < activePkgPrice;
            return (
              <div key={p.id} className={`relative rounded-2xl p-5 transition-all hover:-translate-y-1 ${
                featured
                  ? "bg-gradient-brand text-white shadow-brand ring-brand"
                  : "bg-card border border-border/70 shadow-card hover:shadow-brand"
              } ${isLower ? "opacity-60" : ""}`}>
                {isActive && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow">
                    <CheckCircle2 className="h-3 w-3" /> Already Active
                  </span>
                )}
                {!isActive && featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white text-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow">
                    <Crown className="h-3 w-3" /> Popular
                  </span>
                )}
                <h3 className={`font-display text-lg font-bold ${featured ? "" : "text-primary"}`}>{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`font-display text-3xl font-bold ${featured ? "" : "text-foreground"}`}>৳{price.toLocaleString()}</span>
                </div>
                <ul className={`mt-4 space-y-2 text-sm ${featured ? "text-white/90" : "text-muted-foreground"}`}>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> দৈনিক <b>{p.daily_task_limit}</b> টি task</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> দৈনিক <b>৳{Number(p.daily_earning)}</b> ইনকাম</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> ৩৬৫ দিন valid</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> Refer commission ১০%</li>
                </ul>
                {authed ? (
                  isActive ? (
                    <Link to="/user/dashboard" className={`block mt-5 text-center py-2.5 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition`}>
                      ✓ Dashboard
                    </Link>
                  ) : isUpgrade ? (
                    <Link to="/user/packages" className={`block mt-5 text-center py-2.5 rounded-xl font-semibold transition ${
                      featured ? "bg-white text-primary hover:bg-white/90" : "bg-gradient-brand text-white hover:opacity-95"
                    }`}>
                      ⬆ Upgrade — বেশি আয় করুন
                    </Link>
                  ) : isLower ? (
                    <button disabled className="block w-full mt-5 text-center py-2.5 rounded-xl font-semibold bg-muted text-muted-foreground cursor-not-allowed">
                      Lower than active
                    </button>
                  ) : (
                    <Link to="/user/packages" className={`block mt-5 text-center py-2.5 rounded-xl font-semibold transition ${
                      featured ? "bg-white text-primary hover:bg-white/90" : "bg-gradient-brand text-white hover:opacity-95"
                    }`}>
                      কিনুন →
                    </Link>
                  )
                ) : (
                  <Link to="/register" className={`block mt-5 text-center py-2.5 rounded-xl font-semibold transition ${
                    featured ? "bg-white text-primary hover:bg-white/90" : "bg-gradient-brand text-white hover:opacity-95"
                  }`}>
                    Login করে দেখুন →
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {authed && activePkgPrice > 0 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            🎉 আপনার active package চলছে — <b className="text-primary">বড় package নিলে আরো বেশি দৈনিক ইনকাম</b> করতে পারবেন!
          </p>
        )}
        {!authed && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            🔒 প্যাকেজ কিনতে হলে আগে <Link to="/login" className="text-primary font-semibold hover:underline">Login</Link> অথবা <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link> করুন
          </p>
        )}
      </section>

      {/* Live withdrawals */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              LIVE — এখনই withdraw হচ্ছে
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              প্রতি <span className="text-gradient-brand">৩ সেকেন্ডে</span> একজন<br />টাকা withdraw করছেন
            </h2>
            <p className="text-muted-foreground mt-3">
              নিচের list real-time update হয়। বিকাশ, নগদ, রকেট — সব method সাপোর্টেড। আপনার পরের নাম-ও এখানে আসবে 🎉
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-pink-50 text-pink-700 px-3 py-1.5 text-xs font-semibold">📱 bKash</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 text-orange-700 px-3 py-1.5 text-xs font-semibold">📱 Nagad</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 text-purple-700 px-3 py-1.5 text-xs font-semibold">📱 Rocket</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 px-3 py-1.5 text-xs font-semibold">💳 Upay</span>
            </div>
          </div>
          <div>
            <LiveTicker />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <Reviews />

      {/* Brands / Partners */}
      <BrandsMarquee />

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-8 md:p-14 text-white text-center shadow-brand">
          <div aria-hidden className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-float" />
          <div aria-hidden className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <TrendingUp className="h-10 w-10 mx-auto mb-3" />
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              আজই শুরু করুন — কালকে থেকেই income
            </h2>
            <p className="mt-3 text-white/85 max-w-xl mx-auto">
              Free signup, instant approve। ১ মিনিটেই account খুলে আজই প্রথম task complete করুন।
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 mt-7 px-8 py-4 bg-white text-primary font-bold rounded-2xl shadow-2xl hover:scale-[1.02] transition">
              <Rocket className="h-4 w-4" /> Free Register করুন
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card/40 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Accepted Payment Methods</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
              <PayLogo name="bKash" bg="bg-pink-600" />
              <PayLogo name="Nagad" bg="bg-orange-500" />
              <PayLogo name="Rocket" bg="bg-purple-700" />
              <PayLogo name="Upay" bg="bg-emerald-600" />
            </div>
          </div>
          <div className="border-t border-border/60 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} <span className="font-semibold text-gradient-brand">ClickTaka</span> — Bangladesh's #1 task earning platform.</span>
            <span>Crafted by <a href="#" className="font-semibold text-primary hover:underline">OpenXcell Agency</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: React.ComponentType<{className?: string}>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-3.5">
      <Icon className="h-4 w-4 text-primary mx-auto" />
      <p className="font-display text-lg md:text-xl font-bold mt-1.5 tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, desc, tone }: { icon: React.ComponentType<{className?: string}>; title: string; desc: string; tone: "warning" | "success" | "info" }) {
  const tones = {
    warning: "bg-warning/15 text-warning",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
  } as const;
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
      <span className={`inline-grid place-items-center h-10 w-10 rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-display font-semibold text-lg mt-3">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function PayLogo({ name, bg }: { name: string; bg: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3.5 py-2 shadow-sm">
      <span className={`grid place-items-center h-7 w-7 rounded-lg text-white text-[11px] font-bold ${bg}`}>{name[0]}</span>
      <span className="font-semibold text-sm text-foreground">{name}</span>
    </div>
  );
}
