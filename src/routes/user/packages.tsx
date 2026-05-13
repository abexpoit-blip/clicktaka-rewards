import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Crown, Sparkles, CheckCircle2, Calendar, Coins, Target, Gift,
  ShieldCheck, Zap, TrendingUp, ArrowRight, Star, Wallet, Flame,
  X, CreditCard, Smartphone, Lock, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/user/packages")({ component: PackagesPage });

type Package = {
  id: number; name: string; price: number;
  daily_task_limit: number; daily_earning: number; validity_days: number;
};

// Visual theme per tier (deterministic by index)
const THEMES = [
  { name: "Silver",   ring: "ring-slate-300",   grad: "from-slate-400 to-slate-600",       chip: "bg-slate-100 text-slate-700",     icon: ShieldCheck, accent: "text-slate-600", glow: "shadow-slate-300/40" },
  { name: "Bronze",   ring: "ring-amber-300",   grad: "from-amber-500 to-orange-600",      chip: "bg-amber-100 text-amber-800",     icon: Star,       accent: "text-amber-700", glow: "shadow-amber-300/50" },
  { name: "Gold",     ring: "ring-yellow-300",  grad: "from-yellow-400 via-amber-500 to-orange-500", chip: "bg-yellow-100 text-yellow-800", icon: Crown,      accent: "text-yellow-700", glow: "shadow-yellow-400/50" },
  { name: "Platinum", ring: "ring-cyan-300",    grad: "from-cyan-500 via-blue-500 to-indigo-600", chip: "bg-cyan-100 text-cyan-800",    icon: Sparkles,   accent: "text-cyan-700",  glow: "shadow-cyan-400/50" },
  { name: "Diamond",  ring: "ring-fuchsia-300", grad: "from-fuchsia-500 via-purple-500 to-indigo-600", chip: "bg-fuchsia-100 text-fuchsia-800", icon: Flame,    accent: "text-fuchsia-700", glow: "shadow-fuchsia-400/50" },
];

function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [modalPkg, setModalPkg] = useState<Package | null>(null);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [method, setMethod] = useState<string>("balance");

  function load() {
    api<{ packages: Package[] }>("/packages")
      .then((d) => setPackages(d.packages || []))
      .finally(() => setLoading(false));
    api<{ user: { balance: number } }>("/user/me")
      .then((d) => setBalance(Number(d.user.balance)))
      .catch(() => {});
  }
  useEffect(load, []);

  function openUpgrade(p: Package) {
    setModalPkg(p);
    setStep("select");
    setMethod("balance");
  }
  function closeModal() {
    if (buying !== null) return;
    setModalPkg(null);
  }

  async function confirmBuy() {
    if (!modalPkg) return;
    const p = modalPkg;
    if (method === "balance" && balance < p.price) {
      toast.error(`Balance কম! আপনার আছে ৳${balance.toLocaleString()}, দরকার ৳${p.price.toLocaleString()}।`);
      return;
    }
    if (method !== "balance") {
      toast.info("এই payment method এখন setup হচ্ছে — আপাতত Balance থেকে activate করুন।");
      return;
    }
    setBuying(p.id);
    try {
      await api(`/user/packages/${p.id}/buy`, { method: "POST" });
      toast.success(`${p.name} package activate হয়েছে! 🎉`);
      setModalPkg(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBuying(null);
    }
  }

  if (loading) return <SkeletonGrid />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand text-white shadow-brand p-6 sm:p-8">
        <div aria-hidden className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-float" />
        <div aria-hidden className="absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-primary-glow/40 blur-3xl" />
        <div aria-hidden className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }} />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider font-bold">
              <Crown className="h-3 w-3" /> Investment Packages
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-3 tracking-tight">
              আপনার জন্য সেরা <span className="shimmer-text">প্যাকেজ</span> বেছে নিন
            </h1>
            <p className="mt-2 text-white/85 text-sm sm:text-base max-w-xl">
              যত বড় প্যাকেজ — তত বেশি দৈনিক income, বেশি tasks, বেশি refer commission। কোনো hidden charge নেই।
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/25 p-4 min-w-[180px]">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/80">
              <Wallet className="h-3 w-3" /> Your Balance
            </div>
            <p className="font-display text-2xl font-bold tabular-nums mt-1">৳{balance.toLocaleString()}</p>
            <Link to="/user/deposit" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold underline-offset-2 hover:underline">
              Deposit করুন <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Badge icon={ShieldCheck} title="১০০% Safe" sub="২ কোটি+ payout" tone="success" />
        <Badge icon={Zap} title="Instant Active" sub="খোনই unlock" tone="warning" />
        <Badge icon={TrendingUp} title="Daily Income" sub="Guaranteed" tone="primary" />
        <Badge icon={Gift} title="Refer Bonus" sub="১০% commission" tone="info" />
      </div>

      {/* Packages grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((p, i) => {
            const t = THEMES[i % THEMES.length];
            const Icon = t.icon;
            const featured = i === Math.min(2, packages.length - 1);
            const roi = p.price > 0 ? Math.round((Number(p.daily_earning) * p.validity_days / Number(p.price)) * 100) : 0;
            const can = balance >= p.price;

            return (
              <article
                key={p.id}
                className={`group relative overflow-hidden rounded-3xl bg-card border border-border/70 shadow-card hover:shadow-brand transition-all hover:-translate-y-1 ${featured ? `ring-2 ${t.ring} ${t.glow} shadow-2xl` : ""}`}
              >
                {/* Top gradient stripe */}
                <div aria-hidden className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.grad}`} />

                {featured && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg z-10">
                    <Crown className="h-3 w-3" /> Most Popular
                  </span>
                )}

                <div className="p-6">
                  {/* Header with icon */}
                  <div className="flex items-center gap-3">
                    <div className={`grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br ${t.grad} text-white shadow-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${t.chip}`}>{t.name} Tier</span>
                      <h3 className="font-display text-xl font-bold mt-1 tracking-tight">{p.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-bold tabular-nums">৳{Number(p.price).toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">one-time</span>
                  </div>

                  {/* ROI badge */}
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-2.5 py-1 text-[11px] font-bold">
                    <TrendingUp className="h-3 w-3" /> {roi}% ROI in {p.validity_days} days
                  </div>

                  {/* Features */}
                  <ul className="mt-5 space-y-2.5 text-sm">
                    <Feature icon={Target}     label={<>দৈনিক <b className="tabular-nums">{p.daily_task_limit}</b> টি task</>} />
                    <Feature icon={Coins}      label={<>দৈনিক ইনকাম <b className="text-success tabular-nums">৳{Number(p.daily_earning).toLocaleString()}</b></>} />
                    <Feature icon={Calendar}   label={<><b className="tabular-nums">{p.validity_days}</b> দিন valid</>} />
                    <Feature icon={Gift}       label={<>Refer commission <b>১০%</b></>} />
                    <Feature icon={Zap}        label={<>Spin & bonus rewards</>} />
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => openUpgrade(p)}
                    className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold text-sm transition shadow-brand bg-gradient-to-r ${t.grad} text-white hover:scale-[1.02]`}
                  >
                    <Crown className="h-4 w-4" /> Upgrade Now <ArrowRight className="h-4 w-4" />
                  </button>
                  {!can && (
                    <Link to="/user/deposit" className="block mt-2 text-center text-xs font-semibold text-primary hover:underline">
                      ৳{(p.price - balance).toLocaleString()} আরো deposit করুন →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* FAQ / trust footer */}
      <section className="rounded-3xl border border-border/70 bg-gradient-brand-soft p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-gradient-brand text-white shadow-brand shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">নিরাপদ ও স্বচ্ছ লেনদেন</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              সব transaction সরাসরি bKash/Nagad/Rocket এ। Package activate হওয়ার সাথে সাথেই আপনি tasks করতে পারবেন এবং income শুরু হবে। যেকোনো সমস্যায় <b>২৪/৭ support</b> পাবেন।
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Pill>✓ No hidden charge</Pill>
              <Pill>✓ Instant activation</Pill>
              <Pill>✓ Daily payout</Pill>
              <Pill>✓ ২৪/৭ Support</Pill>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Upgrade Modal */}
      {modalPkg && (
        <UpgradeModal
          pkg={modalPkg}
          balance={balance}
          step={step}
          setStep={setStep}
          method={method}
          setMethod={setMethod}
          buying={buying === modalPkg.id}
          onClose={closeModal}
          onConfirm={confirmBuy}
        />
      )}
    </div>
  );
}

function UpgradeModal({
  pkg, balance, step, setStep, method, setMethod, buying, onClose, onConfirm,
}: {
  pkg: Package; balance: number;
  step: "select" | "confirm"; setStep: (s: "select" | "confirm") => void;
  method: string; setMethod: (m: string) => void;
  buying: boolean; onClose: () => void; onConfirm: () => void;
}) {
  const roi = pkg.price > 0 ? Math.round((Number(pkg.daily_earning) * pkg.validity_days / Number(pkg.price)) * 100) : 0;
  const balanceShort = method === "balance" && balance < pkg.price;
  const methods = [
    { id: "balance", label: "My Balance", sub: `৳${balance.toLocaleString()} available`, icon: Wallet, grad: "from-violet-500 to-fuchsia-500", instant: true },
    { id: "bkash",   label: "bKash",      sub: "Instant payment",                      icon: Smartphone, grad: "from-pink-500 to-rose-600",      instant: true },
    { id: "nagad",   label: "Nagad",      sub: "Mobile banking",                       icon: Smartphone, grad: "from-orange-500 to-red-500",      instant: true },
    { id: "card",    label: "Card",       sub: "Visa / Mastercard",                    icon: CreditCard, grad: "from-sky-500 to-indigo-600",      instant: false },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-fade-in">
      <div aria-hidden className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border/70 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-brand text-white px-6 py-5">
          <div aria-hidden className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <button onClick={onClose} disabled={buying}
            className="absolute top-3 right-3 grid place-items-center h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 transition disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-wider font-bold">
              <Crown className="h-3 w-3" /> Premium Upgrade
            </div>
            <h3 className="font-display text-2xl font-bold mt-2">{pkg.name}</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold tabular-nums">৳{Number(pkg.price).toLocaleString()}</span>
              <span className="text-xs text-white/80">one-time • {pkg.validity_days} days valid</span>
            </div>
            {/* Step indicator */}
            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${step === "select" ? "bg-white text-primary" : "bg-white/20"}`}>
                <span className={`grid place-items-center h-4 w-4 rounded-full text-[9px] ${step === "select" ? "bg-primary text-white" : "bg-white/30"}`}>1</span> Method
              </span>
              <span className="h-px flex-1 bg-white/30" />
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${step === "confirm" ? "bg-white text-primary" : "bg-white/20"}`}>
                <span className={`grid place-items-center h-4 w-4 rounded-full text-[9px] ${step === "confirm" ? "bg-primary text-white" : "bg-white/30"}`}>2</span> Confirm
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === "select" ? (
            <>
              <p className="text-sm font-bold">Payment method বেছে নিন</p>
              <div className="space-y-2">
                {methods.map((m) => {
                  const Icon = m.icon;
                  const sel = method === m.id;
                  return (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition ${sel ? "border-primary bg-gradient-brand-soft" : "border-border bg-card hover:border-primary/40"}`}>
                      <div className={`grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br ${m.grad} text-white shrink-0 shadow`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{m.label}</p>
                        <p className="text-[11px] text-muted-foreground">{m.sub}</p>
                      </div>
                      {m.instant && <span className="text-[10px] font-bold text-success uppercase tracking-wider">Instant</span>}
                      <span className={`grid place-items-center h-5 w-5 rounded-full border-2 ${sel ? "border-primary bg-primary text-white" : "border-border"}`}>
                        {sel && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {balanceShort && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-xl p-2.5">
                  ⚠ Balance অপ্রতুল। দরকার ৳{(pkg.price - balance).toLocaleString()} আরো — Deposit করুন বা অন্য method বেছে নিন।
                </p>
              )}
              <button onClick={() => setStep("confirm")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-white px-5 py-3 font-bold shadow-brand hover:scale-[1.02] transition">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-bold">আপনার order review করুন</p>
              <div className="rounded-2xl border border-border bg-gradient-brand-soft p-4 space-y-2">
                <Row label="Package" value={pkg.name} />
                <Row label="Daily earning" value={`৳${Number(pkg.daily_earning).toLocaleString()}`} accent />
                <Row label="Daily tasks" value={String(pkg.daily_task_limit)} />
                <Row label="Validity" value={`${pkg.validity_days} days`} />
                <Row label="Total ROI" value={`${roi}%`} accent />
                <div className="border-t border-border/60 pt-2 flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Pay via</span>
                  <span className="font-bold text-sm capitalize">{method}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold tabular-nums">৳{Number(pkg.price).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-success/10 text-success p-2.5 text-xs">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>সম্পূর্ণ secured transaction। Activate হলেই আজই income শুরু হবে।</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep("select")} disabled={buying}
                  className="px-4 py-3 rounded-2xl border border-border bg-card text-sm font-bold hover:bg-accent/40 transition disabled:opacity-50">
                  Back
                </button>
                <button onClick={onConfirm} disabled={buying || balanceShort}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-white px-5 py-3 font-bold shadow-brand hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100">
                  {buying ? <><Loader2 className="h-4 w-4 animate-spin" /> Activating...</> : <><Sparkles className="h-4 w-4" /> Confirm &amp; Pay</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold tabular-nums ${accent ? "text-success" : ""}`}>{value}</span>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: React.ComponentType<{className?: string}>; label: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-foreground/90">
      <span className="grid place-items-center h-5 w-5 rounded-full bg-success/15 text-success shrink-0">
        <CheckCircle2 className="h-3 w-3" />
      </span>
      <span>{label}</span>
    </li>
  );
}

function Badge({ icon: Icon, title, sub, tone }: { icon: React.ComponentType<{className?: string}>; title: string; sub: string; tone: "primary"|"info"|"success"|"warning" }) {
  const tones = {
    primary: "text-primary bg-primary/10",
    info: "text-info bg-info/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/15",
  } as const;
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3.5 flex items-center gap-3">
      <span className={`grid place-items-center h-9 w-9 rounded-xl ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="font-display font-bold text-sm">{title}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-card border border-border/60 px-2.5 py-1 font-medium">{children}</span>;
}

function SkeletonGrid() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 rounded-3xl bg-card" />
      <div className="grid grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 rounded-2xl bg-card"/>)}</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({length:6}).map((_,i)=><div key={i} className="h-96 rounded-3xl bg-card"/>)}</div>
    </div>
  );
}
