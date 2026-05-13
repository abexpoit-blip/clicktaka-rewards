// Random Bkash/Nagad withdraw highlights ticker — social proof
import { useEffect, useState } from "react";
import { Flame, CheckCircle2 } from "lucide-react";

const NAMES = [
  "Sohel Rana", "Tania Akter", "Sumi Begum", "Naim Hasan", "Arif Hossain",
  "Rakib Khan", "Mehedi Hasan", "Faria Islam", "Tasnim Sultana", "Sabbir Ahmed",
  "Nadia Akter", "Bappi Mia", "Shihab Uddin", "Mim Akter", "Rahim Uddin",
  "Karim Sheikh", "Sajid Rahman", "Riya Akter", "Jubayer Hossain", "Lima Khatun",
  "Asif Mahmud", "Nabila Ferdous", "Tanvir Alam", "Sadia Rahman", "Imran Kabir",
];
const METHODS = ["Bkash", "Nagad", "Bkash", "Nagad", "Rocket", "Upay"];
const AMOUNTS = [200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function genItem() {
  return {
    id: Math.random(),
    name: rand(NAMES),
    method: rand(METHODS),
    amount: rand(AMOUNTS),
    seconds: Math.floor(Math.random() * 50) + 5,
  };
}

const METHOD_STYLE: Record<string, string> = {
  Bkash: "bg-pink-100 text-pink-700 border-pink-200",
  Nagad: "bg-orange-100 text-orange-700 border-orange-200",
  Rocket: "bg-purple-100 text-purple-700 border-purple-200",
  Upay: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function LiveTicker() {
  const [items, setItems] = useState(() => Array.from({ length: 7 }, genItem));

  useEffect(() => {
    const t = setInterval(() => setItems((prev) => [genItem(), ...prev.slice(0, 6)]), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-emerald-50 via-white to-amber-50 border border-emerald-200 rounded-2xl p-4 shadow-card overflow-hidden">
      <div aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Withdrawals</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5">
            Real-time
          </span>
        </div>

        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={it.id}
              className={`flex items-center gap-3 rounded-xl bg-white/70 backdrop-blur border border-white px-3 py-2 transition ${
                i === 0 ? "animate-fade-in shadow-sm ring-1 ring-emerald-200" : "opacity-95"
              }`}
            >
              <div className="grid place-items-center h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold shrink-0 shadow">
                {it.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 truncate">
                  <b className="font-bold">{it.name}</b>{" "}
                  <span className="text-slate-500">withdraw করেছেন via</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${METHOD_STYLE[it.method] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {it.method}
                  </span>
                  <span className="text-[10px] text-slate-500 inline-flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> {it.seconds}s ago
                  </span>
                </div>
              </div>
              <span className="font-extrabold text-emerald-600 whitespace-nowrap text-sm tabular-nums">
                +৳{it.amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
