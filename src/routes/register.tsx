import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — ClickTaka" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", password: "", refer_by: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link to="/" className="block text-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          ClickTaka
        </Link>
        <h1 className="text-center text-xl font-semibold mb-6">নতুন একাউন্ট খুলুন</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="আপনার নাম (optional)"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
          <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
          <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="পাসওয়ার্ড (৬+ অক্ষর)" required minLength={6}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
          <input value={form.refer_by} onChange={(e) => set("refer_by", e.target.value)} placeholder="Refer code (optional)"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />

          {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}
          <button disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg disabled:opacity-50">
            {loading ? "অপেক্ষা করুন..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          আগে থেকেই account আছে?{" "}
          <Link to="/login" className="text-purple-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}
