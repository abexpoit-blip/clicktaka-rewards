import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/kt-admin-login")({
  head: () => ({ meta: [{ title: "Admin — ClickTaka" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api<{ is_admin: boolean }>("/auth/login", { method: "POST", json: { phone, password } });
      if (!res.is_admin) { setErr("Admin access নেই"); return; }
      navigate({ to: "/kt-admin/dashboard" });
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <h1 className="text-center text-2xl font-bold text-white mb-1">🔒 Admin Panel</h1>
        <p className="text-center text-sm text-slate-400 mb-6">Authorized access only</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Admin phone" required
            className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
            className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg" />
          {err && <div className="text-sm text-red-400">{err}</div>}
          <button className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700">Login</button>
        </form>
      </div>
    </div>
  );
}
