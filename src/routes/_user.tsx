import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Toaster } from "@/components/ui/sonner";

type User = { id: number; phone: string; name: string | null; balance: number; refer_code: string };

export const Route = createFileRoute("/_user")({ component: UserLayout });

function UserLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    api<{ user: User }>("/user/me")
      .then((d) => { setUser(d.user); setLoading(false); })
      .catch(() => navigate({ to: "/login" }));
  }, [navigate]);

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    navigate({ to: "/login" });
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">লোডিং...</div>;
  if (!user) return null;

  const nav = [
    { to: "/user/dashboard", label: "🏠 Dashboard" },
    { to: "/user/tasks", label: "🎯 Tasks" },
    { to: "/user/spin", label: "🎡 Spin" },
    { to: "/user/packages", label: "📦 Packages" },
    { to: "/user/deposit", label: "💰 Deposit" },
    { to: "/user/withdraw", label: "💸 Withdraw" },
    { to: "/user/refer", label: "👥 Refer" },
    { to: "/user/history", label: "📜 History" },
    { to: "/user/profile", label: "👤 Profile" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/user/dashboard" className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">ClickTaka</Link>
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-gray-500">Balance: </span>
              <span className="font-bold text-green-600">৳{Number(user.balance).toLocaleString()}</span>
            </div>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
          {nav.map((n) => (
            <Link key={n.to} to={n.to}
              className={`px-3 py-1.5 text-xs whitespace-nowrap rounded-lg transition ${
                path === n.to ? "bg-purple-600 text-white" : "text-gray-700 hover:bg-purple-50"
              }`}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
