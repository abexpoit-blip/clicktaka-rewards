import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Toaster } from "@/components/ui/sonner";
import {
  LayoutDashboard, Target, Disc3, Package, Wallet, Send, Users, History, UserCircle2,
  LogOut, Banknote, ChevronRight,
} from "lucide-react";

type User = { id: number; phone: string; name: string | null; balance: number; refer_code: string };

export const Route = createFileRoute("/user")({ component: UserLayout });

const NAV = [
  { to: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/user/tasks", label: "Tasks", icon: Target },
  { to: "/user/spin", label: "Spin", icon: Disc3 },
  { to: "/user/packages", label: "Packages", icon: Package },
  { to: "/user/deposit", label: "Deposit", icon: Wallet },
  { to: "/user/withdraw", label: "Withdraw", icon: Send },
  { to: "/user/refer", label: "Refer", icon: Users },
  { to: "/user/history", label: "History", icon: History },
  { to: "/user/profile", label: "Profile", icon: UserCircle2 },
] as const;

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

  if (loading) return (
    <div className="min-h-screen grid-noise flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        লোডিং...
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen grid-noise text-foreground">
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/user/dashboard" className="flex items-center gap-2 group">
            <span className="relative grid place-items-center h-9 w-9 rounded-xl bg-gradient-brand shadow-brand">
              <Banknote className="h-4 w-4 text-white" strokeWidth={2.5} />
              <span className="absolute inset-0 rounded-xl animate-pulse-glow" />
            </span>
            <span className="font-display text-xl font-bold text-gradient-brand tracking-tight">ClickTaka</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Balance</span>
              <span className="font-bold text-sm tabular-nums text-foreground">৳{Number(user.balance).toLocaleString()}</span>
            </div>
            <span className="sm:hidden font-bold text-sm tabular-nums text-primary">৳{Number(user.balance).toLocaleString()}</span>
            <button onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition">
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 pb-2.5 flex gap-1.5 overflow-x-auto scrollbar-none">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <Link key={to} to={to}
                className={`group relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold whitespace-nowrap rounded-xl transition-all ${
                  active
                    ? "bg-gradient-brand text-white shadow-brand"
                    : "text-muted-foreground hover:text-foreground bg-card/40 border border-border/50 hover:border-primary/40 hover:bg-accent/40"
                }`}>
                <Icon className={`h-3.5 w-3.5 ${active ? "" : "text-primary/80"}`} strokeWidth={2.3} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-1.5">
          <span>Powered by</span>
          <span className="font-display font-semibold text-gradient-brand">ClickTaka</span>
          <ChevronRight className="h-3 w-3" />
          <span>Earn smarter, every day.</span>
        </div>
      </footer>
      <Toaster position="top-center" richColors />
    </div>
  );
}
