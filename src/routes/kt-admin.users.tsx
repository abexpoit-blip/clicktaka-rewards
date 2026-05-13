import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/kt-admin/users")({ component: AdminUsers });

type U = { id: number; phone: string; name: string | null; balance: number; refer_code: string; status: string; is_admin: number; created_at: string };

function AdminUsers() {
  const [users, setUsers] = useState<U[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  function load(s = "") {
    setLoading(true);
    api<{ users: U[] }>(`/admin/users${s ? `?search=${encodeURIComponent(s)}` : ""}`)
      .then((r) => setUsers(r.users))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function toggleBlock(id: number) {
    await api(`/admin/users/${id}/block`, { method: "POST" });
    load(search);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Users</h1>
        <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="phone বা name search..."
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm" />
          <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm">Search</button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? <p className="p-6 text-center text-slate-400">লোডিং...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50 text-slate-300">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Phone</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-right px-3 py-2">Balance</th>
                  <th className="text-left px-3 py-2">Refer</th>
                  <th className="text-center px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Joined</th>
                  <th className="text-right px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2 text-slate-400">#{u.id}</td>
                    <td className="px-3 py-2">{u.phone}</td>
                    <td className="px-3 py-2">{u.name || "-"} {u.is_admin ? <span className="text-xs px-1.5 py-0.5 bg-purple-600/30 text-purple-300 rounded ml-1">admin</span> : null}</td>
                    <td className="px-3 py-2 text-right text-green-400 font-semibold">৳{Number(u.balance).toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{u.refer_code}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${u.status === 'blocked' ? 'bg-red-600/30 text-red-300' : 'bg-green-600/30 text-green-300'}`}>{u.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-right">
                      {!u.is_admin && (
                        <button onClick={() => toggleBlock(u.id)}
                          className={`text-xs px-2 py-1 rounded ${u.status === 'blocked' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                          {u.status === 'blocked' ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-400">কোনো user নেই।</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
