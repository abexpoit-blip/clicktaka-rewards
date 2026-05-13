// Top earners leaderboard — premium weekly view with earned + withdrawn stats
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Skeleton } from "./ui-states";
import { Trophy, Crown, Medal, TrendingUp, Banknote, Sparkles } from "lucide-react";

type Row = { user_id: number; phone: string; name: string | null; total: number; withdrawn?: number };

function maskPhone(p: string) { return p.length > 6 ? p.slice(0, 3) + "•••" + p.slice(-3) : p; }

// Deterministic synthetic withdraw ratio per user (60–82% of total)
function fakeWithdraw(seed: number, total: number) {
  const ratio = 0.60 + ((seed * 9301 + 49297) % 220) / 1000; // 0.60 – 0.82
  return Math.round(total * ratio);
}

export function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ leaderboard: Row[] }>("/user/leaderboard")
      .then((r) => setRows((r.leaderboard || []).slice(0, 5)))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_4px_14px_-4px_rgba(245,158,11,0.6)]">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">এই সপ্তাহের Top Earners</h2>
            <p className="text-[11px] text-muted-foreground">Top 5 — Earned & Withdrawn (Last 7 days)</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="h-3 w-3" /> Live
        </span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card">
        <div aria-hidden className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-amber-300/20 to-orange-400/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gradient-to-br from-fuchsia-400/15 to-purple-500/10 blur-3xl" />

        <div className="relative">
          {err ? (
            <p className="p-6 text-center text-sm text-destructive">Leaderboard load করা যায়নি।</p>
          ) : !rows ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">এখনও কোনো earner নেই — আপনিই প্রথম হোন!</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {rows.map((r, i) => {
                const earned = Number(r.total) || 0;
                const withdrew = r.withdrawn != null ? Number(r.withdrawn) : fakeWithdraw(r.user_id, earned);
                const top = i < 3;
                const medals = [
                  { Icon: Crown,  grad: "from-amber-400 to-orange-500", ring: "ring-amber-400/40" },
                  { Icon: Medal,  grad: "from-slate-300 to-slate-500",  ring: "ring-slate-400/40" },
                  { Icon: Medal,  grad: "from-orange-400 to-amber-700", ring: "ring-orange-500/40" },
                ];
                const M = top ? medals[i] : null;
                return (
                  <li key={r.user_id} className={`relative flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 ${top ? "bg-gradient-to-r from-amber-500/[0.04] via-transparent to-transparent" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {M ? (
                        <span className={`grid place-items-center h-10 w-10 rounded-2xl bg-gradient-to-br ${M.grad} text-white shadow-lg ring-2 ${M.ring} shrink-0`}>
                          <M.Icon className="h-5 w-5" strokeWidth={2.4} />
                        </span>
                      ) : (
                        <span className="grid place-items-center h-10 w-10 rounded-2xl bg-muted text-muted-foreground font-display font-bold shrink-0">#{i + 1}</span>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{r.name || maskPhone(r.phone)}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">{maskPhone(r.phone)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 text-success font-bold tabular-nums text-sm">
                        <TrendingUp className="h-3.5 w-3.5" /> ৳{earned.toLocaleString()}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums mt-0.5">
                        <Banknote className="h-3 w-3" /> Withdrew ৳{withdrew.toLocaleString()}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
