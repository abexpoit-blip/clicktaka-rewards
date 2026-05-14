import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { bumpBalance } from "@/lib/active-task";
import {
  Wallet, Smartphone, Send, Sparkles, Info, History, ArrowUpFromLine,
} from "lucide-react";
import { Field, RequestRow } from "./deposit";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";

export const Route = createFileRoute("/user/withdraw")({ component: WithdrawPage });

type Settings = { min_withdraw: number };
type Withdrawal = {
  id: number; method: string; amount: number; payment_number: string;
  status: "pending" | "approved" | "rejected"; created_at: string; admin_note: string | null;
};
type Me = { user: { balance: number } };

const METHODS = [
  { id: "bkash",  label: "Bkash",  logo: bkashLogo },
  { id: "nagad",  label: "Nagad",  logo: nagadLogo },
] as const;

function WithdrawPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState(0);
  const [method, setMethod] = useState<typeof METHODS[number]["id"]>("bkash");
  const [amount, setAmount] = useState<string>("");
  const [num, setNum] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api<{ settings: Settings }>("/payment-settings").then((r) => setS(r.settings)).catch(() => {});
    api<{ withdrawals: Withdrawal[] }>("/user/withdrawals").then((r) => setHistory(r.withdrawals || [])).catch(() => {});
    api<Me>("/user/me").then((r) => setBalance(Number(r.user.balance))).catch(() => {});
  }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt < (s?.min_withdraw || 0)) return toast.error(`Minimum withdraw ৳${s?.min_withdraw || 0}`);
    if (amt > balance) return toast.error("Balance যথেষ্ট না");
    if (!/^01\d{9}$/.test(num.trim())) return toast.error("সঠিক 11-digit number দিন (01XXXXXXXXX)");
    setBusy(true);
    try {
      await api("/user/withdraw", { method: "POST", json: { method, amount: amt, payment_number: num.trim() } });
      // Optimistic balance deduction in header — admin will verify
      bumpBalance(-amt);
      toast.success("Withdraw request পাঠানো হয়েছে");
      setAmount(""); setNum(""); load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 text-white shadow-2xl p-6 sm:p-7">
        <div aria-hidden className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-float" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider font-bold">
              <ArrowUpFromLine className="h-3 w-3" /> Cash Out
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-3 tracking-tight">টাকা Withdraw করুন</h1>
            <p className="mt-1 text-white/85 text-sm">Bkash / Nagad — 1–24 ঘণ্টায় deliver</p>
          </div>
          <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/80 font-bold">Available Balance</p>
            <p className="font-display text-2xl font-bold tabular-nums">৳{balance.toLocaleString()}</p>
            <p className="text-[10px] text-white/70 mt-0.5">Min ৳{s?.min_withdraw ?? "—"}</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
        <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-card">
          <h2 className="font-display text-lg font-bold flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" /> Method বাছুন</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {METHODS.map((mm) => {
              const active = mm.id === method;
              return (
                <button key={mm.id} type="button" onClick={() => setMethod(mm.id)}
                  className={`relative rounded-2xl border p-3 text-center transition ${
                    active ? "border-primary ring-2 ring-primary/20 bg-gradient-brand-soft" : "border-border/70 hover:border-primary/40 bg-card"
                  }`}>
                  <div className={`mx-auto grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br ${mm.color} text-white text-lg shadow-md`}>{mm.emoji}</div>
                  <p className="mt-2 text-xs font-bold">{mm.label}</p>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <Field label="Amount (৳)" hint={`Min ৳${s?.min_withdraw ?? "—"} · Max ৳${balance.toLocaleString()}`}>
              <input type="number" min={s?.min_withdraw || 0} max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-base tabular-nums font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder={`${s?.min_withdraw ?? 500}`} />
            </Field>
            <Field label="আপনার Payment Number" hint="যেখানে টাকা যাবে — 01XXXXXXXXX">
              <input value={num} onChange={(e) => setNum(e.target.value)} required pattern="01[0-9]{9}" maxLength={11}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-mono tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="01XXXXXXXXX" />
            </Field>
            <div className="flex gap-2">
              {[s?.min_withdraw || 500, 1000, 2000].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))}
                  className="flex-1 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted px-3 py-2 text-xs font-bold text-foreground transition tabular-nums">
                  ৳{v.toLocaleString()}
                </button>
              ))}
            </div>
            <button disabled={busy} type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white px-4 py-3.5 text-sm font-bold shadow-2xl hover:scale-[1.01] transition disabled:opacity-60">
              <Send className="h-4 w-4" /> {busy ? "পাঠানো হচ্ছে…" : "Submit Withdraw Request"}
            </button>
          </form>

          <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-slate-800 dark:text-slate-100 border border-blue-200 dark:border-blue-800/60 p-3 text-xs flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-300 shrink-0 mt-0.5" />
            <span>Submit করার সাথে সাথেই balance থেকে টাকা hold হবে। Admin verify করার পর আপনার Bkash/Nagad-এ পাঠিয়ে দেওয়া হবে।</span>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold">আমার Withdraw History</h3>
            </div>
            {history.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground text-sm">এখনও কোনো withdraw নেই</p>
            ) : (
              <ul className="divide-y divide-border/60 max-h-[420px] overflow-y-auto">
                {history.map((d) => <RequestRow key={d.id} r={d} txnLabel="→" extra={d.payment_number} />)}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-border/70 bg-gradient-brand-soft p-4">
            <p className="text-xs font-bold text-primary inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> আরো income</p>
            <p className="text-xs text-muted-foreground mt-1">Refer করুন ও প্রতিটি successful refer-এ 10% commission পান।</p>
            <Link to="/user/refer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Refer Page →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
