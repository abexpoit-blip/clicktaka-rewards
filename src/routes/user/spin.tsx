import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Lock, Crown, Sparkles, Gift } from "lucide-react";

export const Route = createFileRoute("/user/spin")({ component: SpinPage });

// Wheel slices DB থেকে আসে (admin-এ configurable)। নিচেরটা শুধু fallback।
const DEFAULT_SLICES = [10, 50, 100, 150, 200, 300, 400, 500, 800, 1000];
const PALETTE = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#0891b2", "#9333ea", "#16a34a", "#ea580c", "#be185d"];

type SpinStatus = {
  has_package: boolean;
  package_price: number;
  spins_limit: number;
  spins_used: number;
  spins_left: number;
  last: { reward: number } | null;
  slices?: number[];
};

const SPIN_TIERS: { price: number; spins: number; label: string }[] = [
  { price: 500,   spins: 1,  label: "Silver" },
  { price: 1000,  spins: 2,  label: "Silver 2" },
  { price: 2000,  spins: 3,  label: "Silver 3" },
  { price: 5000,  spins: 5,  label: "Gold" },
  { price: 10000, spins: 8,  label: "Diamond" },
  { price: 20000, spins: 12, label: "Royal" },
];

function SpinPage() {
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [err, setErr] = useState("");

  function loadStatus() {
    setErr("");
    api<SpinStatus>("/user/spin/status")
      .then((data) => {
        setStatus(data);
        setErr("");
      })
      .catch((e) => setErr(e.message));
  }
  useEffect(loadStatus, []);

  const slices = status?.slices && status.slices.length >= 2 ? status.slices : DEFAULT_SLICES;
  const colors = slices.map((_, i) => PALETTE[i % PALETTE.length]);

  async function spin() {
    if (spinning || !status || status.spins_left <= 0 || !status.has_package) return;
    setSpinning(true);
    try {
      const res = await api<{ ok: boolean; reward: number; balance: number; spins_left: number; spins_limit: number }>(
        "/user/spin", { method: "POST" }
      );
      const idx = slices.indexOf(res.reward);
      const sliceAngle = 360 / slices.length;
      const rewardIndex = idx >= 0 ? idx : 0;
      const target = 360 - (rewardIndex * sliceAngle + sliceAngle / 2);
      setAngle((current) => current + 360 * 5 + ((target - (current % 360) + 360) % 360));
      setTimeout(() => {
        setSpinning(false);
        setStatus((s) => s ? {
          ...s,
          spins_used: s.spins_used + 1,
          spins_left: res.spins_left,
          last: { reward: res.reward },
        } : s);
        toast.success(`🎉 আপনি জিতলেন ৳${res.reward}!`, { duration: 4000 });
      }, 4200);
    } catch (e: any) {
      setSpinning(false);
      toast.error(e.message || "Spin করা যায়নি");
      loadStatus();
    }
  }

  const sliceAngle = 360 / slices.length;
  const gradient = slices.map((_, i) => `${colors[i]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(", ");

  // No active package — show upgrade gate
  if (status && !status.has_package) {
    return (
      <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold">🎡 Daily Spin Wheel</h1>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6 sm:p-8 text-center shadow-card">
          <div className="grid place-items-center mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold mt-4">Spin করতে হলে Package activate করুন</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            যত বড় package, তত বেশি দৈনিক spin chance — প্রতি spin-এ ৳১০ থেকে ৳১০০ পর্যন্ত জিততে পারেন।
          </p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left">
            {SPIN_TIERS.map((t) => (
              <div key={t.price} className="rounded-xl bg-white/80 backdrop-blur border border-border/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">{t.label}</p>
                <p className="font-display font-bold text-base tabular-nums">৳{t.price.toLocaleString()}</p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  <Sparkles className="inline h-3 w-3" /> {t.spins} spin/দিন
                </p>
              </div>
            ))}
          </div>

          <Link
            to="/user/packages"
            className="inline-flex items-center justify-center gap-2 mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-brand hover:scale-[1.02] transition"
          >
            <Crown className="h-4 w-4" /> Package দেখুন
          </Link>
        </div>
      </div>
    );
  }

  const canSpin = !!status && status.has_package && status.spins_left > 0 && !spinning;

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto px-1">
      <div className="text-center">
        <h1 className="text-2xl font-bold">🎡 Daily Spin Wheel</h1>
        <p className="text-sm text-gray-600 mt-1">প্রতি spin-এ ৳১০ থেকে ৳১০০০ পর্যন্ত জিতুন!</p>
      </div>

      {status && (
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 flex items-center justify-between gap-3 shadow-card">
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shrink-0">
              <Gift className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">আজকের spin</p>
              <p className="text-sm font-bold tabular-nums">
                {status.spins_used} / {status.spins_limit} ব্যবহৃত
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">বাকি</p>
            <p className="font-display text-lg font-bold tabular-nums text-emerald-600">{status.spins_left}</p>
          </div>
        </div>
      )}

      {err && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{err}</div>}

      <div className="relative mx-auto aspect-square w-full max-w-[340px]">
        <div className="absolute left-1/2 -top-3 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg" />
        <div
          className="relative w-full h-full rounded-full shadow-2xl border-8 border-white overflow-hidden"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${angle}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.21, 1)" : "none",
          }}
        >
          {slices.map((n: number, i: number) => {
            const a = i * sliceAngle + sliceAngle / 2;
            return (
              <div
                key={n}
                className="absolute left-1/2 top-1/2 text-white font-bold text-sm sm:text-base select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${a}deg) translateY(-110px)`,
                  transformOrigin: "center center",
                }}
              >
                ৳{n}
              </div>
            );
          })}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-xl border-4 border-yellow-400 flex items-center justify-center text-3xl z-10">🎁</div>
      </div>

      <div className="text-center">
        <button
          onClick={spin}
          disabled={!canSpin}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
        >
          {spinning ? "🌀 ঘুরছে..."
            : !status ? "লোডিং..."
            : status.spins_left <= 0 ? "✅ আজকের সব spin শেষ"
            : `🎯 SPIN NOW (${status.spins_left} বাকি)`}
        </button>
        {status?.last && (
          <p className="mt-3 text-green-600 font-semibold">শেষ জেতা: ৳{Number(status.last.reward)}</p>
        )}
      </div>
    </div>
  );
}
