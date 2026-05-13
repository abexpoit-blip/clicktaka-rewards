import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Banknote, User, Phone, Lock, Gift, UserPlus } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — ClickTaka" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", password: "", refer_by: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm({ ...form, [k]: v }); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await api("/auth/register", { method: "POST", json: form });
      navigate({ to: "/user/dashboard" });
    } catch (e: any) {
      setErr(e.message || "Registration failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid-noise text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <span className="grid place-items-center h-11 w-11 rounded-2xl bg-gradient-brand shadow-brand">
            <Banknote className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-2xl font-bold text-gradient-brand tracking-tight">ClickTaka</span>
        </Link>

        <div className="rounded-3xl border border-border/70 bg-card shadow-card p-7 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">নতুন একাউন্ট খুলুন</h1>
            <p className="text-sm text-muted-foreground mt-1">৩০ সেকেন্ডে Sign up — আজই Earning শুরু</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <Field icon={User} label="নাম (optional)">
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="আপনার নাম"
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60" />
            </Field>
            <Field icon={Phone} label="মোবাইল নম্বর">
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" required
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60" />
            </Field>
            <Field icon={Lock} label="পাসওয়ার্ড">
              <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="৬+ অক্ষর" required minLength={6}
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60" />
            </Field>
            <Field icon={Gift} label="Refer code (optional)">
              <input value={form.refer_by} onChange={(e) => set("refer_by", e.target.value)} placeholder="যেমন: KT12AB"
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60" />
            </Field>

            {err && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg">{err}</div>}

            <button disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-brand text-white font-bold rounded-xl shadow-brand hover:scale-[1.01] transition disabled:opacity-60">
              <UserPlus className="h-4 w-4" />
              {loading ? "অপেক্ষা করুন..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            আগে থেকেই account আছে?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Login</Link>
          </p>
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
