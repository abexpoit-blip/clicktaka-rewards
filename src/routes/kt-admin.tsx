import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/kt-admin")({ component: AdminLayout });

type Me = { user: { id: number; phone: string; name: string | null; is_admin: number } };

function AdminLayout() {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    api<Me>("/user/me")
      .then((d) => {
        if (!d.user.is_admin) { navigate({ to: "/kt-admin/login" }); return; }
        setOk(true); setLoading(false);
      })
      .catch(() => navigate({ to: "/kt-admin/login" }));
  }, [navigate]);

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    navigate({ to: "/kt-admin/login" });
  }

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">লোডিং...</div>;
  if (!ok) return null;

  const nav = [
    { to: "/kt-admin/dashboard", label: "📊 Overview" },
    { to: "/kt-admin/users", label: "👥 Users" },
    { to: "/kt-admin/tasks", label: "🎯 Tasks/Ads" },
    { to: "/kt-admin/earnings", label: "💰 Earnings" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/kt-admin/dashboard" className="text-lg font-bold text-purple-400">🔒 ClickTaka Admin</Link>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
        </div>
        <nav className="max-w-7xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
          {nav.map((n) => (
            <Link key={n.to} to={n.to}
              className={`px-3 py-1.5 text-sm whitespace-nowrap rounded-lg transition ${
                path === n.to ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-700"
              }`}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
