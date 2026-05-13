import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Wallet, Send, Settings2, Save, CheckCircle2, XCircle, Clock,
  Smartphone, ShieldCheck, RefreshCw, ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";

export const Route = createFileRoute("/kt-admin/payments")({ component: AdminPayments });

type Settings = {
  bkash_number: string;
  nagad_number: string;
  rocket_number?: string;
  min_deposit: number;
  min_withdraw: number;
  referral_percent: number;
};
type Deposit = {
  id: number; user_id: number; phone: string; name: string | null;
  method: string; amount: number; transaction_id: string;
  status: "pending" | "approved" | "rejected"; admin_note: string | null;
  created_at: string;
};
type Withdrawal = {
  id: number; user_id: number; phone: string; name: string | null;
  method: string; amount: number; payment_number: string;
  status: "pending" | "approved" | "rejected"; admin_note: string | null;
  created_at: string;
};

type Tab = "settings" | "deposits" | "withdrawals";

function AdminPayments() {
  const [tab, setTab] = useState<Tab>("settings");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-fuchsia-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent">Payments Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">Bkash / Nagad / Rocket — settings, deposit & withdraw queue</p>
        </div>
      </header>

      <nav className="flex gap-1.5 rounded-2xl border border-white/10 bg-slate-900/60 p-1.5 w-fit">
        {[
          { id: "settings",    label: "Method Settings", icon: Settings2 },
          { id: "deposits",    label: "Deposits",        icon: ArrowDownToLine },
          { id: "withdrawals", label: "Withdrawals",     icon: ArrowUpFromLine },
        ].map((t) => {
          const Icon = t.icon; const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white shadow-[0_8px_24px_-6px_rgba(168,85,247,0.55)]"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "settings"    && <SettingsPanel />}
      {tab === "deposits"    && <DepositsPanel />}
      {tab === "withdrawals" && <WithdrawalsPanel />}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────
function SettingsPanel() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api<{ settings: Settings }>("/admin/payment-settings")
      .then((r) => setS(r.settings))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save() {
    if (!s) return;
    setSaving(true);
    try {
      await api("/admin/payment-settings", { method: "PUT", json: s });
      toast.success("Settings সেভ হয়েছে ✓");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <PanelSkeleton />;
  if (!s) return <ErrorBox text="Settings লোড করা যাচ্ছে না" onRetry={load} />;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
          <Smartphone className="h-4 w-4 text-fuchsia-300" /> Payment Methods
        </h2>
        <div className="space-y-3">
          <NumField icon="📱" label="Bkash Number"  value={s.bkash_number}  onChange={(v) => setS({ ...s, bkash_number: v })} placeholder="01XXXXXXXXX" />
          <NumField icon="🟧" label="Nagad Number"  value={s.nagad_number}  onChange={(v) => setS({ ...s, nagad_number: v })} placeholder="01XXXXXXXXX" />
          <NumField icon="🚀" label="Rocket Number" value={s.rocket_number || ""} onChange={(v) => setS({ ...s, rocket_number: v })} placeholder="01XXXXXXXXX" />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-emerald-300" /> Limits & Commission
        </h2>
        <div className="space-y-3">
          <AmountField label="Minimum Deposit (৳)"   value={s.min_deposit}   onChange={(v) => setS({ ...s, min_deposit: v })} />
          <AmountField label="Minimum Withdraw (৳)"  value={s.min_withdraw}  onChange={(v) => setS({ ...s, min_withdraw: v })} />
          <AmountField label="Referral Commission %" value={s.referral_percent} onChange={(v) => setS({ ...s, referral_percent: v })} suffix="%" />
        </div>
        <button onClick={save} disabled={saving}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(168,85,247,0.55)] hover:scale-[1.01] transition disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Settings"}
        </button>
      </section>
    </div>
  );
}

function NumField({ icon, label, value, onChange, placeholder }: { icon: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5"><span>{icon}</span> {label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white tabular-nums focus:border-fuchsia-400/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20 transition" />
    </label>
  );
}
function AmountField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{label}</span>
      <div className="mt-1 flex rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-fuchsia-400/50 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-white tabular-nums focus:outline-none" />
        {suffix && <span className="grid place-items-center px-3 text-xs font-bold text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}

// ── Deposits ──────────────────────────────────────────────────────────────
function DepositsPanel() {
  const [rows, setRows] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  function load() {
    setLoading(true);
    api<{ deposits: Deposit[] }>(`/admin/deposits?status=${filter}`)
      .then((r) => setRows(r.deposits || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [filter]);

  async function decide(id: number, action: "approve" | "reject") {
    const note = action === "reject" ? prompt("কেন reject করছেন? (optional)") || "" : "";
    try {
      await api(`/admin/deposits/${id}/${action}`, { method: "POST", json: { note } });
      toast.success(action === "approve" ? "Deposit approve হয়েছে ✓" : "Deposit reject হয়েছে");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <RequestQueue
      title="Deposit Requests"
      icon={ArrowDownToLine}
      tone="emerald"
      rows={rows}
      loading={loading}
      filter={filter}
      onFilter={setFilter}
      onReload={load}
      renderExtra={(r: any) => (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono">TXN: {r.transaction_id}</span>
        </span>
      )}
      onApprove={(id) => decide(id, "approve")}
      onReject={(id) => decide(id, "reject")}
    />
  );
}

// ── Withdrawals ───────────────────────────────────────────────────────────
function WithdrawalsPanel() {
  const [rows, setRows] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  function load() {
    setLoading(true);
    api<{ withdrawals: Withdrawal[] }>(`/admin/withdrawals?status=${filter}`)
      .then((r) => setRows(r.withdrawals || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [filter]);

  async function decide(id: number, action: "approve" | "reject") {
    const note = action === "reject" ? prompt("কেন reject করছেন? (optional)") || "" : "";
    try {
      await api(`/admin/withdrawals/${id}/${action}`, { method: "POST", json: { note } });
      toast.success(action === "approve" ? "Withdraw approve হয়েছে ✓" : "Withdraw reject হয়েছে");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <RequestQueue
      title="Withdraw Requests"
      icon={ArrowUpFromLine}
      tone="rose"
      rows={rows}
      loading={loading}
      filter={filter}
      onFilter={setFilter}
      onReload={load}
      renderExtra={(r: any) => (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono">→ {r.payment_number}</span>
        </span>
      )}
      onApprove={(id) => decide(id, "approve")}
      onReject={(id) => decide(id, "reject")}
    />
  );
}

// ── Shared queue UI ───────────────────────────────────────────────────────
function RequestQueue({
  title, icon: Icon, tone, rows, loading, filter, onFilter, onReload, onApprove, onReject, renderExtra,
}: {
  title: string; icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "rose";
  rows: any[]; loading: boolean;
  filter: "pending" | "all"; onFilter: (f: "pending" | "all") => void;
  onReload: () => void;
  onApprove: (id: number) => void; onReject: (id: number) => void;
  renderExtra: (r: any) => React.ReactNode;
}) {
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const accent = tone === "emerald"
    ? "from-emerald-500 to-teal-500 text-emerald-300 bg-emerald-500/10 border-emerald-400/30"
    : "from-rose-500 to-orange-500 text-rose-300 bg-rose-500/10 border-rose-400/30";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className={`grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br ${accent.split(" ").slice(0,2).join(" ")} text-white`}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display font-bold">{title}</h2>
            <p className="text-[11px] text-slate-400">Total: <b className="text-slate-200 tabular-nums">৳{total.toLocaleString()}</b> · {rows.length} entries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-slate-800/80 p-1 flex gap-1">
            {(["pending", "all"] as const).map((f) => (
              <button key={f} onClick={() => onFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition capitalize ${filter === f ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={onReload} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </header>

      {loading ? <PanelSkeleton /> : rows.length === 0 ? (
        <p className="p-10 text-center text-slate-400 text-sm">কোনো request নেই 🌙</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((r) => (
            <li key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-white/5 transition">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`grid place-items-center h-11 w-11 rounded-xl uppercase font-bold text-white bg-gradient-to-br ${accent.split(" ").slice(0,2).join(" ")} shrink-0`}>
                  {(r.name?.[0] || r.phone?.[0] || "U").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.name || r.phone} <span className="text-xs text-slate-500">#{r.user_id}</span></p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{r.method}</span>
                    {renderExtra(r)}
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  {r.admin_note && <p className="text-[11px] text-slate-400 italic mt-1 truncate">📝 {r.admin_note}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0">
                <span className="font-display text-xl font-bold tabular-nums text-white">৳{Number(r.amount).toLocaleString()}</span>
                {r.status === "pending" ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => onApprove(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 px-2.5 py-1.5 text-xs font-bold text-emerald-300 transition">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => onReject(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 px-2.5 py-1.5 text-xs font-bold text-rose-300 transition">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                    r.status === "approved" ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30" : "bg-rose-500/10 text-rose-300 border-rose-400/30"
                  }`}>
                    {r.status === "approved" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {r.status}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PanelSkeleton() {
  return (
    <div className="p-5 space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-800/50" />)}
    </div>
  );
}
function ErrorBox({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-200 flex items-center justify-between gap-3">
      <span className="text-sm">{text}</span>
      <button onClick={onRetry} className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-bold hover:bg-rose-500/30">
        <RefreshCw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}
