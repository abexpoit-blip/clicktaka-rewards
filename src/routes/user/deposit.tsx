import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Wallet, Smartphone, Copy, CheckCircle2, Clock, XCircle, Send,
  ShieldCheck, ArrowDownToLine, Sparkles, Info, History,
} from "lucide-react";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";

export const Route = createFileRoute("/user/deposit")({ component: DepositPage });

type Settings = { bkash_number: string; nagad_number: string; rocket_number?: string; min_deposit: number };
type Deposit = {
  id: number; method: string; amount: number; transaction_id: string;
  status: "pending" | "approved" | "rejected"; created_at: string; admin_note: string | null;
};

const METHODS = [
  { id: "bkash",  label: "bKash",  color: "from-pink-500 to-rose-500",     logo: bkashLogo },
  { id: "nagad",  label: "Nagad",  color: "from-orange-500 to-amber-500",  logo: nagadLogo },
] as const;

function DepositPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [history, setHistory] = useState<Deposit[]>([]);
  const [method, setMethod] = useState<typeof METHODS[number]["id"]>("bkash");
  const [amount, setAmount] = useState<string>("");
  const [txn, setTxn] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    api<{ settings: Settings }>("/payment-settings").then((r) => setS(r.settings)).catch(() => {});
    api<{ deposits: Deposit[] }>("/user/deposits").then((r) => setHistory(r.deposits || [])).catch(() => {});
  }
  useEffect(load, []);

  const target = s ? (method === "bkash" ? s.bkash_number : s.nagad_number) : "";

  function copyNumber() {
    if (!target) return;
    navigator.clipboard.writeText(target).then(() => {
      setCopied(true); toast.success("Number copy হয়েছে"); setTimeout(() => setCopied(false), 1500);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt < (s?.min_deposit || 0)) return toast.error(`Minimum deposit ৳${s?.min_deposit || 0}`);
    if (!txn.trim()) return toast.error("Transaction ID দিন");
    setBusy(true);
    try {
      await api("/user/deposit", { method: "POST", json: { method, amount: amt, transaction_id: txn.trim() } });
      toast.success("Deposit request পাঠানো হয়েছে — admin verify করবে");
      setAmount(""); setTxn(""); load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-brand text-white shadow-brand p-6 sm:p-7">
        <div aria-hidden className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl animate-float" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider font-bold">
              <ArrowDownToLine className="h-3 w-3" /> Add Money
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-3 tracking-tight">Account-এ Deposit করুন</h1>
            <p className="mt-1 text-white/85 text-sm">Bkash / Nagad — instant verify</p>
          </div>
          <div className="rounded-2xl bg-white/12 backdrop-blur border border-white/15 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Min. Deposit</p>
            <p className="font-display text-xl font-bold tabular-nums">৳{s?.min_deposit ?? "—"}</p>
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
                  <div className="mx-auto grid place-items-center h-12 w-12 rounded-xl bg-white border border-border/60 shadow-md overflow-hidden">
                    <img src={mm.logo} alt={`${mm.label} logo`} className="h-9 w-9 object-contain" />
                  </div>
                  <p className="mt-2 text-xs font-bold">{mm.label}</p>
                </button>
              );
            })}
          </div>

          {target ? (
            <div className="mt-4 rounded-2xl border-2 border-primary/40 bg-gradient-brand-soft p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-foreground/70 font-bold">এই {METHODS.find(m => m.id === method)?.label} number-এ Send Money করুন</p>
                <p className="font-display text-2xl font-bold tabular-nums tracking-wide text-foreground">{target}</p>
                <p className="text-[11px] text-foreground/70 mt-1">📌 শুধুমাত্র <b>Send Money</b> করুন (Cash Out নয়)</p>
              </div>
              <button onClick={copyNumber} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-brand text-white px-3.5 py-2 text-xs font-bold shadow-brand hover:scale-[1.03] transition">
                {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Admin এই method-এর জন্য number set করেননি। অন্য method চেষ্টা করুন।
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-3">
            <Field label="Amount (৳)" hint={`Minimum ৳${s?.min_deposit ?? "—"}`}>
              <input type="number" min={s?.min_deposit || 0} value={amount} onChange={(e) => setAmount(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-base tabular-nums font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="500" />
            </Field>
            <Field label="Transaction ID" hint="Bkash/Nagad SMS-এর TrxID">
              <input value={txn} onChange={(e) => setTxn(e.target.value)} required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition" placeholder="9XXXX12345" />
            </Field>
            <button disabled={busy || !target} type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand text-white px-4 py-3.5 text-sm font-bold shadow-brand hover:scale-[1.01] transition disabled:opacity-60">
              <Send className="h-4 w-4" /> {busy ? "পাঠানো হচ্ছে…" : "Submit Deposit Request"}
            </button>
          </form>

          <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-slate-800 dark:text-slate-100 border border-blue-200 dark:border-blue-800/60 p-3 text-xs flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-300 shrink-0 mt-0.5" />
            <span>উপরের number-এ <b>Send Money</b> করার পর SMS-এ আসা <b>Transaction ID</b> এখানে paste করুন। 1–10 মিনিটের মধ্যে balance যোগ হবে।</span>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold">আমার Deposit History</h3>
            </div>
            {history.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground text-sm">এখনও কোনো deposit নেই</p>
            ) : (
              <ul className="divide-y divide-border/60 max-h-[420px] overflow-y-auto">
                {history.map((d) => <RequestRow key={d.id} r={d} txnLabel="TXN" extra={d.transaction_id} />)}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-border/70 bg-gradient-brand-soft p-4">
            <p className="text-xs font-bold text-primary inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Pro tip</p>
            <p className="text-xs text-muted-foreground mt-1">Deposit করে Premium Package নিন — দৈনিক ৩০–১৩০০ টাকা income শুরু করুন।</p>
            <Link to="/user/packages" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Packages দেখুন →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-end justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function RequestRow({ r, txnLabel, extra }: { r: { id: number; method: string; amount: number; status: string; created_at: string; admin_note: string | null }; txnLabel: string; extra: string }) {
  const tone = r.status === "approved" ? "text-success bg-success/10 border-success/20"
    : r.status === "rejected" ? "text-destructive bg-destructive/10 border-destructive/20"
    : "text-warning bg-warning/10 border-warning/20";
  const Icon = r.status === "approved" ? CheckCircle2 : r.status === "rejected" ? XCircle : Clock;
  return (
    <li className="px-4 sm:px-5 py-3 hover:bg-accent/20 transition">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-sm uppercase">{r.method}</p>
          <p className="text-[11px] text-muted-foreground font-mono truncate">{txnLabel}: {extra}</p>
          <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-bold tabular-nums">৳{Number(r.amount).toLocaleString()}</p>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${tone}`}>
            <Icon className="h-3 w-3" /> {r.status}
          </span>
        </div>
      </div>
      {r.admin_note && <p className="mt-1 text-[11px] text-muted-foreground italic">📝 {r.admin_note}</p>}
    </li>
  );
}
