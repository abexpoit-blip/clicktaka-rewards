import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  Search, Users as UsersIcon, ShieldCheck, ShieldOff, Crown, Filter,
  RefreshCw, UserCheck, UserX, LogIn,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/kt-admin/users")({ component: AdminUsers });

type U = { id: number; phone: string; name: string | null; balance: number; refer_code: string; status: string; is_admin: number; created_at: string };

function AdminUsers() {
  const [users, setUsers] = useState<U[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "blocked" | "admin">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  function load(s = "") {
    setLoading(true);
    api<{ users: U[] }>(`/admin/users${s ? `?search=${encodeURIComponent(s)}` : ""}`)
      .then((r) => setUsers(r.users))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function toggleBlock(id: number, status: string) {
    setBusy(id);
    try {
      await api(`/admin/users/${id}/block`, { method: "POST" });
      toast.success(status === "blocked" ? "User unblocked" : "User blocked");
      load(search);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function loginAs(u: U) {
    if (!confirm(`${u.name || u.phone} (#${u.id}) — এই user হিসেবে login করবেন?\n\nAdmin session শেষ হয়ে যাবে। আবার /kt-admin দিয়ে login করতে হবে।`)) return;
    setBusy(u.id);
    try {
      await api(`/admin/users/${u.id}/impersonate`, { method: "POST" });
      toast.success(`Logged in as ${u.name || u.phone}`);
      window.location.href = "/user/dashboard";
    } catch (e: any) {
      toast.error(e.message);
      setBusy(null);
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filter === "active") return u.status === "active" && !u.is_admin;
      if (filter === "blocked") return u.status === "blocked";
      if (filter === "admin") return !!u.is_admin;
      return true;
    });
  }, [users, filter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    blocked: users.filter((u) => u.status === "blocked").length,
    admin: users.filter((u) => u.is_admin).length,
    totalBalance: users.reduce((s, u) => s + Number(u.balance), 0),
  }), [users]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-violet-400" /> Users Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage all registered users, balances and access.</p>
        </div>
        <button onClick={() => load(search)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-sm text-slate-200">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="মোট Users" value={stats.total} icon={UsersIcon} from="from-violet-500" to="to-purple-600" />
        <MiniStat label="Active" value={stats.active} icon={UserCheck} from="from-emerald-500" to="to-teal-600" />
        <MiniStat label="Blocked" value={stats.blocked} icon={UserX} from="from-rose-500" to="to-red-600" />
        <MiniStat label="মোট Balance" value={`৳${stats.totalBalance.toLocaleString()}`} icon={Crown} from="from-amber-500" to="to-orange-600" />
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/80 p-3 flex flex-wrap items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Phone বা Name দিয়ে search..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none rounded-xl text-sm text-white placeholder:text-slate-500 transition"
          />
        </form>
        <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 border border-slate-700 p-1">
          <Filter className="h-3.5 w-3.5 text-slate-400 ml-2" />
          {(["all", "active", "blocked", "admin"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition ${
                filter === f ? "bg-violet-600 text-white shadow" : "text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/80 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" /> লোডিং...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">কোনো user পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Phone</th>
                  <th className="text-right px-4 py-3 font-semibold">Balance</th>
                  <th className="text-left px-4 py-3 font-semibold">Refer</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`grid place-items-center h-10 w-10 rounded-xl text-white text-sm font-bold shrink-0 ${
                          u.is_admin ? "bg-gradient-to-br from-amber-500 to-orange-600" :
                          u.status === "blocked" ? "bg-gradient-to-br from-rose-500 to-red-600" :
                          "bg-gradient-to-br from-violet-500 to-fuchsia-600"
                        }`}>
                          {(u.name || u.phone)[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate flex items-center gap-1.5">
                            {u.name || "Unnamed"}
                            {!!u.is_admin && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                          </p>
                          <p className="text-xs text-slate-500">#{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.phone}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-400 font-bold tabular-nums">৳{Number(u.balance).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-2 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-violet-300">
                        {u.refer_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                        u.status === "blocked" ? "bg-rose-500/15 text-rose-300 border border-rose-500/30" :
                        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "blocked" ? "bg-rose-400" : "bg-emerald-400"}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!u.is_admin && (
                        <button
                          onClick={() => toggleBlock(u.id, u.status)}
                          disabled={busy === u.id}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
                            u.status === "blocked"
                              ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {u.status === "blocked" ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                          {u.status === "blocked" ? "Unblock" : "Block"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, from, to }: { label: string; value: number | string; icon: any; from: string; to: string }) {
  return (
    <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/80 p-4 flex items-center gap-3">
      <div className={`grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br ${from} ${to} text-white shadow-lg shrink-0`}>
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
      </div>
    </div>
  );
}
