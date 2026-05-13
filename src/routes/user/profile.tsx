import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  UserCircle2, Phone, Wallet, Hash, Copy, Check, Shield, LogOut,
  ArrowDownCircle, ArrowUpCircle, Send, Sparkles, Calendar, Star,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/user/profile")({ component: ProfilePage });

type User = { id: number; phone: string; name: string | null; balance: number; refer_code: string; created_at?: string };
type Tx = { id: number; type: string; amount: number; balance_after: number | null; note: string | null; created_at: string };

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ user: User }>("/user/me"),
      api<{ transactions: Tx[] }>("/user/transactions").catch(() => ({ transactions: [] as Tx[] })),
    ])
      .then(([u, t]) => { setUser(u.user); setTxs(t.transactions || []); })
      .finally(() => setLoading(false));
  }, []);

  function copyCode() {
    navigator.clipboard.writeText(user?.refer_code || "").then(() => {
      setCopied(true); toast.success("Refer code কপি হয়েছে");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>;
  }
  if (!user) return null;

  const initials = (user.name || user.phone).slice(0, 2).toUpperCase();
  const totalIn = txs.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = txs.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  return (
    <div className="space-y-6">
      {/* Hero profile card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-2xl">
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-300 to-rose-400 grid place-items-center text-2xl font-bold text-white shadow-xl ring-4 ring-white/20">
              {initials}
            </div>
            <span className="absolute -bottom-1 -right-1 grid place-items-center h-7 w-7 rounded-full bg-emerald-400 text-emerald-900 ring-2 ring-white">
              <Shield className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-white/70 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Verified Member
            </p>
            <h1 className="text-2xl font-bold truncate">{user.name || "ClickTaka User"}</h1>
            <p className="text-sm text-white/80 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {user.phone}</p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 backdrop-blur p-3 border border-white/20">
            <p className="text-[10px] uppercase tracking-wider text-white/70">Balance</p>
            <p className="text-xl font-bold tabular-nums">৳{Number(user.balance).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur p-3 border border-white/20">
            <p className="text-[10px] uppercase tracking-wider text-white/70">User ID</p>
            <p className="text-xl font-bold tabular-nums">#{user.id}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/user/deposit" icon={ArrowDownCircle} label="Deposit" from="from-emerald-500" toGrad="to-teal-500" />
        <QuickAction href="/user/withdraw" icon={ArrowUpCircle} label="Withdraw" from="from-rose-500" toGrad="to-pink-500" />
        <QuickAction href="/user/refer" icon={Send} label="Refer" from="from-violet-500" toGrad="to-fuchsia-500" />
      </div>

      {/* Info grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        <InfoRow icon={UserCircle2} label="পূর্ণ নাম" value={user.name || "—"} />
        <InfoRow icon={Phone} label="মোবাইল" value={user.phone} />
        <InfoRow icon={Wallet} label="বর্তমান Balance" value={`৳${Number(user.balance).toLocaleString()}`} valueClass="text-emerald-600 font-bold" />
        <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
            <Hash className="h-3.5 w-3.5" /> Refer Code
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="font-mono font-bold text-violet-700 text-lg tracking-wider">{user.refer_code}</p>
            <button onClick={copyCode} className="rounded-lg bg-violet-50 border border-violet-200 text-violet-700 px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1 hover:bg-violet-100">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
            </button>
          </div>
        </div>
      </div>

      {/* Transaction summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <ArrowDownCircle className="h-4 w-4" /> মোট Income
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">+৳{totalIn.toFixed(0)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
            <ArrowUpCircle className="h-4 w-4" /> মোট খরচ
          </div>
          <p className="mt-1 text-2xl font-bold text-rose-700 tabular-nums">-৳{totalOut.toFixed(0)}</p>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Calendar className="h-4 w-4 text-violet-500" /> সাম্প্রতিক Transactions</h3>
          <Link to="/user/history" className="text-xs font-semibold text-violet-600 hover:text-violet-700">দেখুন সব →</Link>
        </div>
        {txs.length === 0 ? (
          <div className="p-10 text-center">
            <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">এখনও কোনো transaction নেই</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {txs.slice(0, 8).map((t) => {
              const amt = Number(t.amount);
              const isIn = amt >= 0;
              return (
                <li key={t.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`grid place-items-center h-9 w-9 rounded-xl ${isIn ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                    {isIn ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold capitalize text-gray-900">{t.type}</p>
                    <p className="text-xs text-gray-500 truncate">{t.note || new Date(t.created_at).toLocaleString("bn-BD")}</p>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                    {isIn ? "+" : ""}৳{amt.toFixed(2)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        onClick={async () => { await api("/auth/logout", { method: "POST" }).catch(() => {}); window.location.href = "/login"; }}
        className="w-full rounded-2xl bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 py-3 font-semibold flex items-center justify-center gap-2 transition"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, from, toGrad }: { href: string; icon: any; label: string; from: string; toGrad: string }) {
  return (
    <Link to={href} className="group rounded-2xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition text-center">
      <div className={`mx-auto grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br ${from} ${toGrad} text-white shadow-md group-hover:scale-110 transition`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2 text-xs font-semibold text-gray-700">{label}</p>
    </Link>
  );
}

function InfoRow({ icon: Icon, label, value, valueClass }: { icon: any; label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className={`mt-1 text-base text-gray-900 ${valueClass || ""}`}>{value}</p>
    </div>
  );
}
