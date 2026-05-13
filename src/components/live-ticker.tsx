// Random Bkash/Nagad withdraw highlights ticker — social proof
import { useEffect, useState } from "react";

const NAMES = ["Rahim", "Karim", "Sajid", "Mehedi", "Tania", "Riya", "Sumi", "Jubayer", "Naim", "Faria", "Tasnim", "Arif", "Sabbir", "Nadia", "Bappi", "Shihab", "Mim", "Rakib", "Sohel", "Lima"];
const METHODS = ["Bkash", "Nagad", "Bkash", "Nagad", "Rocket"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function maskName(n: string) { return n.length > 3 ? n.slice(0, 2) + "•••" + n.slice(-1) : n + "••"; }

function genItem() {
  const amount = [200, 300, 500, 750, 1000, 1500, 2000, 3000][Math.floor(Math.random() * 8)];
  return { id: Math.random(), name: maskName(rand(NAMES)), method: rand(METHODS), amount };
}

export function LiveTicker() {
  const [items, setItems] = useState(() => Array.from({ length: 6 }, genItem));

  useEffect(() => {
    const t = setInterval(() => setItems((prev) => [genItem(), ...prev.slice(0, 5)]), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200 rounded-xl p-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
        </span>
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">🔥 Live Withdrawals</span>
      </div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={it.id} className={`flex items-center justify-between text-sm ${i === 0 ? "animate-fade-in font-semibold" : "opacity-80"}`}>
            <span className="text-slate-700">
              <b>{it.name}</b> withdraw করেছেন via <span className={it.method === "Bkash" ? "text-pink-600" : it.method === "Nagad" ? "text-orange-600" : "text-purple-600"}>{it.method}</span>
            </span>
            <span className="font-bold text-emerald-600 whitespace-nowrap">+৳{it.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
