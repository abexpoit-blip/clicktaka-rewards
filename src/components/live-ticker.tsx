// Live withdrawals — vertical feed matching the site's light/brand theme
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

const NAMES = [
  "Sohel Rana", "Naim Hasan", "Arif Hossain", "Rakib Khan", "Mehedi Hasan",
  "Sabbir Ahmed", "Bappi Mia", "Shihab Uddin", "Rahim Uddin", "Karim Sheikh",
  "Sajid Rahman", "Jubayer Hossain", "Asif Mahmud", "Tanvir Alam", "Imran Kabir",
  "Mahin Chowdhury", "Foysal Ahmed", "Rasel Mia", "Jewel Rana", "Abdul Karim",
  "Shakib Hasan", "Mizanur Rahman", "Tarek Aziz", "Hasibul Islam", "Nayeem Sarker",
  "Rifat Khan", "Sumon Mahmud", "Zahid Hossain",
  "Tania Akter", "Sumi Begum", "Faria Islam", "Nadia Akter", "Mim Akter",
];
const METHODS = [
  { name: "bKash", cls: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "Nagad", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "Rocket", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "bKash", cls: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "Nagad", cls: "bg-orange-50 text-orange-700 border-orange-200" },
] as const;
const AMOUNTS = [200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000];

function rand<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function maskPhone() {
  const last = String(Math.floor(Math.random() * 90 + 10));
  return `01••• ••${last}`;
}

type Item = { id: number; name: string; method: typeof METHODS[number]; amount: number; ago: string; phone: string };
function genItem(seed = Math.random()): Item {
  const sec = Math.floor(Math.random() * 55) + 2;
  return {
    id: seed,
    name: rand(NAMES),
    method: rand(METHODS),
    amount: rand(AMOUNTS),
    ago: `${sec}s ago`,
    phone: maskPhone(),
  };
}

const AVATAR_GRAD = [
  "from-violet-500 to-indigo-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-500",
  "from-fuchsia-500 to-purple-500",
];

export function LiveTicker() {
  const [items, setItems] = useState<Item[]>(() => Array.from({ length: 5 }, (_, i) => genItem(i + 1)));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => [genItem(), ...prev.slice(0, 4)]);
      setTick((k) => k + 1);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const stats = useMemo(() => {
    if (!mounted) return { today: 1247, paid: "8.4" };
    const minutes = Math.floor(Date.now() / 60000) % 1000;
    return { today: 1247 + (minutes % 80), paid: "8.4" };
  }, [tick, mounted]);

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-[0_10px_40px_-18px_color-mix(in_oklab,var(--primary)_35%,transparent)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-gradient-brand-soft">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Live Withdrawals</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] tabular-nums">
          <span className="text-muted-foreground">আজ <b className="text-foreground">{stats.today.toLocaleString()}</b></span>
          <span className="hidden sm:inline text-muted-foreground">Paid <b className="text-emerald-600">৳{stats.paid}L+</b></span>
        </div>
      </div>

      {/* Feed */}
      <ul className="divide-y divide-border">
        {items.map((it, idx) => {
          const grad = AVATAR_GRAD[Math.floor(it.id * 100) % AVATAR_GRAD.length];
          const initials = it.name.split(" ").map((s) => s[0]).slice(0, 2).join("");
          return (
            <li
              key={it.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${idx === 0 ? "bg-emerald-50/60 animate-[slideIn_0.5s_ease-out]" : "hover:bg-muted/40"}`}
            >
              <span className={`grid place-items-center h-10 w-10 rounded-full bg-gradient-to-br ${grad} text-white text-sm font-bold shadow-md shrink-0`}>
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{it.name}</p>
                  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${it.method.cls}`}>
                    {it.method.name}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{it.phone} · {it.ago}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1 text-emerald-600 font-extrabold text-sm tabular-nums">
                  <Check className="h-3.5 w-3.5" />+৳{it.amount.toLocaleString()}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Paid</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-center">
        <span className="text-[11px] text-muted-foreground">প্রতি ৩ সেকেন্ডে update হচ্ছে…</span>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
