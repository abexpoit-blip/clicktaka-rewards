import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Banknote, Phone, Lock, LogIn, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — ClickTaka" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await api<{ ok: boolean; is_admin: boolean }>("/auth/login", {
        method: "POST",
        json: { phone, password },
      });
      navigate({ to: res.is_admin ? "/kt-admin/dashboard" : "/user/dashboard" });
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid-noise text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 group">
          <span className="grid place-items-center h-11 w-11 rounded-2xl bg-gradient-brand shadow-brand">
            <Banknote className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-2xl font-bold text-gradient-brand tracking-tight">ClickTaka</span>
        </Link>

        <div className="rounded-3xl border border-border/70 bg-card shadow-card p-7 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Welcome Back 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">আপনার একাউন্টে Login করুন</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field icon={Phone} label="মোবাইল নম্বর">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" required
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60" />
            </Field>
            <Field icon={Lock} label="পাসওয়ার্ড">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60" />
            </Field>

            {err && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg">{err}</div>}

            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-brand text-white font-bold rounded-xl shadow-brand hover:scale-[1.01] transition disabled:opacity-60">
              <LogIn className="h-4 w-4" />
              {loading ? "অপেক্ষা করুন..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Account নেই?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">Register করুন</Link>
          </p>

          <div className="mt-5 pt-5 border-t border-border/60 text-center">
            <Link to="/kt-admin/login" className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition">
              <ShieldCheck className="h-3 w-3" /> Admin Login (Staff Only)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: React.ComponentType<{className?: string}>; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-background/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        {children}
      </div>
    </label>
  );
}
