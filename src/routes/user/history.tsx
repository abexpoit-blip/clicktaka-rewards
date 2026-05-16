import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TaskTitle } from "@/lib/package-badge";

export const Route = createFileRoute("/user/history")({ component: HistoryPage });

type Tx = { id: number; type: string; amount: number; balance_after: number | null; note: string | null; created_at: string };
type Completion = { id: number; reward: number; completed_at: string; title: string; type: string };

function HistoryPage() {
  const [tab, setTab] = useState<"earnings" | "transactions">("earnings");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [earns, setEarns] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ transactions: Tx[] }>("/user/transactions"),
      api<{ recent_completions: Completion[] }>("/user/dashboard"),
    ])
      .then(([t, d]) => { setTxs(t.transactions); setEarns(d.recent_completions); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (err) return <div className="text-red-600">{err}</div>;
  if (loading) return <div>লোডিং...</div>;

  const totalEarned = earns.reduce((s, e) => s + Number(e.reward), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-sm opacity-80">History</p>
        <h1 className="text-2xl font-bold">আপনার সমস্ত কার্যকলাপ</h1>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs opacity-80">দেখানো ইনকাম</p>
            <p className="text-xl font-bold">৳{totalEarned.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Transactions</p>
            <p className="text-xl font-bold">{txs.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["earnings", "transactions"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === k ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}>
            {k === "earnings" ? "🎯 Earnings" : "💳 Transactions"}
          </button>
        ))}
      </div>

      {tab === "earnings" ? (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {earns.length === 0 ? (
            <p className="p-8 text-center text-gray-500">এখনও কোনো task complete করেননি।</p>
          ) : (
            <ul className="divide-y">
              {earns.map((c) => (
                <li key={c.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <TaskTitle title={c.title} className="font-medium text-sm" badgeSize="xs" />
                    <p className="text-xs text-gray-500 capitalize">{c.type} • {new Date(c.completed_at).toLocaleString("bn-BD")}</p>
                  </div>
                  <span className="text-green-600 font-bold whitespace-nowrap">+৳{Number(c.reward).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {txs.length === 0 ? (
            <p className="p-8 text-center text-gray-500">কোনো transaction নেই।</p>
          ) : (
            <ul className="divide-y">
              {txs.map((t) => {
                const amt = Number(t.amount);
                const isIn = amt >= 0;
                return (
                  <li key={t.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm capitalize">{t.type}</p>
                      <p className="text-xs text-gray-500 truncate">{t.note || "—"} • {new Date(t.created_at).toLocaleString("bn-BD")}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className={`font-bold ${isIn ? "text-green-600" : "text-red-600"}`}>{isIn ? "+" : ""}৳{amt.toFixed(2)}</p>
                      {t.balance_after !== null && <p className="text-xs text-gray-500">Bal: ৳{Number(t.balance_after).toFixed(2)}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
