// Top earners leaderboard widget
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Skeleton } from "./ui-states";

type Row = { user_id: number; phone: string; name: string | null; total: number };

function maskPhone(p: string) { return p.length > 6 ? p.slice(0, 3) + "•••" + p.slice(-3) : p; }

export function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ leaderboard: Row[] }>("/user/leaderboard")
      .then((r) => setRows(r.leaderboard))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        🏆 এই সপ্তাহের Top Earners
      </h2>
      <div className="bg-gradient-to-br from-amber-50 via-white to-purple-50 rounded-2xl shadow border border-amber-200 overflow-hidden">
        {err ? (
          <p className="p-6 text-center text-sm text-red-600">Leaderboard load করা যায়নি।</p>
        ) : !rows ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">এখনও কোনো earner নেই — আপনিই প্রথম হোন!</p>
        ) : (
          <ul className="divide-y divide-amber-100">
            {rows.map((r, i) => {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              const highlight = i < 3;
              return (
                <li key={r.user_id} className={`flex items-center justify-between px-4 py-2.5 ${highlight ? "bg-gradient-to-r from-amber-100/60 to-transparent" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-lg ${highlight ? "" : "text-slate-400 text-sm font-mono"}`}>{medal}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.name || maskPhone(r.phone)}</p>
                      <p className="text-xs text-slate-500">{maskPhone(r.phone)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600 whitespace-nowrap">৳{Number(r.total).toLocaleString()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
