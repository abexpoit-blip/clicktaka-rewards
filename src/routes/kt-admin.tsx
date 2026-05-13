import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LayoutDashboard, Users, Target, Coins, LogOut, ShieldCheck, Wallet } from "lucide-react";

export const Route = createFileRoute("/kt-admin")({ component: AdminLayout });

type Me = { user: { id: number; phone: string; name: string | null; is_admin: number } };

const NAV = [
  { to: "/kt-admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/kt-admin/users",     label: "Users",    icon: Users },
  { to: "/kt-admin/tasks",     label: "Tasks/Ads",icon: Target },
  { to: "/kt-admin/earnings",  label: "Earnings", icon: Coins },
  { to: "/kt-admin/payments",  label: "Payments", icon: Wallet },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLoginPage = path === "/kt-admin/login";

  useEffect(() => {
    if (isLoginPage) { setLoading(false); return; }
    api<Me>("/user/me")
      .then((d) => {
        if (!d.user.is_admin) { navigate({ to: "/kt-admin/login" }); return; }
        setMe(d.user); setLoading(false);
      })
      .catch(() => navigate({ to: "/kt-admin/login" }));
  }, [navigate, isLoginPage]);

  // Login page renders standalone without admin chrome
  if (isLoginPage) return <Outlet />;

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    navigate({ to: "/kt-admin/login" });
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="h-6 w-6 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
        লোডিং...
      </div>
    </div>
  );
  if (!me) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.15),_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.12),_transparent_50%)] bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/kt-admin/dashboard" className="flex items-center gap-2.5 group">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 shadow-[0_0_24px_rgba(168,85,247,0.45)]">
              <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-bold bg-gradient-to-r from-fuchsia-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent">ClickTaka Admin</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Control Center</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
            <span className="hidden md:inline text-xs text-slate-300">{me.name || me.phone}</span>
            <button onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition">
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-2 pb-2.5 flex gap-1.5 overflow-x-auto scrollbar-none">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <Link key={to} to={to}
                className={`group relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold whitespace-nowrap rounded-xl transition-all ${
                  active
                    ? "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white shadow-[0_8px_24px_-6px_rgba(168,85,247,0.55)]"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                }`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                {label}
                {active && <span className="absolute inset-x-3 -bottom-px h-px bg-white/40" />}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
