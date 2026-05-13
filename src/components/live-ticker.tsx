// Premium compact live withdrawals ticker — horizontal marquee
import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";

// 80% male, 20% female — varied Bangladeshi names
const NAMES = [
  "Sohel Rana", "Naim Hasan", "Arif Hossain", "Rakib Khan", "Mehedi Hasan",
  "Sabbir Ahmed", "Bappi Mia", "Shihab Uddin", "Rahim Uddin", "Karim Sheikh",
  "Sajid Rahman", "Jubayer Hossain", "Asif Mahmud", "Tanvir Alam", "Imran Kabir",
  "Mahin Chowdhury", "Foysal Ahmed", "Rasel Mia", "Jewel Rana", "Abdul Karim",
  "Shakib Hasan", "Mizanur Rahman", "Tarek Aziz", "Hasibul Islam", "Nayeem Sarker",
  "Rifat Khan", "Sumon Mahmud", "Zahid Hossain",
  "Tania Akter", "Sumi Begum", "Faria Islam", "Nadia Akter", "Mim Akter",
  "Riya Akter", "Sadia Rahman",
];
const METHODS = ["Bkash", "Nagad", "Bkash", "Nagad", "Bkash"] as const;
const AMOUNTS = [200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000];

function rand<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

type Item = { id: number; name: string; method: string; amount: number; seconds: number };
function genItem(): Item {
  return {
    id: Math.random(),
    name: rand(NAMES),
    method: rand(METHODS),
    amount: rand(AMOUNTS),
    seconds: Math.floor(Math.random() * 50) + 5,
  };
}

const METHOD_DOT: Record<string, string> = {
  Bkash: "from-pink-500 to-rose-500",
  Nagad: "from-orange-500 to-amber-500",
};

export function LiveTicker() {
  const [items, setItems] = useState<Item[]>(() => Array.from({ length: 14 }, genItem));
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => [genItem(), ...prev.slice(0, 13)]);
      setPulseKey((k) => k + 1);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  // duplicate for seamless infinite marquee
  const loop = useMemo(() => [...items, ...items], [items]);

  // Stats banner numbers (subtly increase over time for FOMO).
  // Use a stable initial value to avoid SSR/client hydration mismatch,
  // then start ticking after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const stats = useMemo(() => {
    if (!mounted) return { today: 1247, paid: 8.4 };
    const minutes = Math.floor(Date.now() / 60000) % 1000;
    return {
      today: 1247 + (minutes % 80),
      paid: 8.4, // lakh
    };
  }, [pulseKey, mounted]);

  return (
    <div className="relative overflow-hidden rounded-2xl p-[1.5px] bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 shadow-[0_10px_40px_-12px_rgba(16,185,129,0.45)]">
      <div className="relative rounded-[14px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* subtle ambient glow */}
        <div aria-hidden className="absolute -top-16 -left-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />

        {/* Header bar */}
        <div className="relative flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Live Withdrawals</span>
            <span className="hidden sm:inline text-[10px] text-emerald-300/80 font-medium">• Real-time</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] tabular-nums shrink-0">
            <span className="text-slate-400">আজ&nbsp;<b className="text-white">{stats.today.toLocaleString()}</b>&nbsp;withdrawals</span>
            <span className="hidden sm:inline text-slate-400">Paid&nbsp;<b className="text-emerald-300">৳{stats.paid}L+</b></span>
          </div>
        </div>

        {/* Marquee row */}
        <div className="relative py-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10 bg-gradient-to-r from-slate-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10 bg-gradient-to-l from-slate-950 to-transparent" />

          <div
            key={pulseKey}
            className="flex gap-2.5 whitespace-nowrap animate-[ticker_50s_linear_infinite] hover:[animation-play-state:paused]"
            style={{ width: "max-content" }}
          >
            {loop.map((it, i) => {
              const grad = METHOD_DOT[it.method] || "from-slate-500 to-slate-700";
              return (
                <div
                  key={`${it.id}-${i}`}
                  className="group inline-flex items-center gap-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-400/40 backdrop-blur px-2.5 py-1.5 transition-all"
                >
                  <span className={`grid place-items-center h-6 w-6 rounded-full bg-gradient-to-br ${grad} text-white text-[10px] font-bold shadow-md shrink-0`}>
                    {it.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-100 tracking-tight">{it.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{it.method}</span>
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 px-1.5 py-0.5 text-[11px] font-extrabold text-emerald-300 tabular-nums shadow-[0_0_12px_-2px_rgba(16,185,129,0.5)]">
                    <Zap className="h-2.5 w-2.5" />+৳{it.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{it.seconds}s</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
