import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Pkg = { id: number; name: string; price: number; daily_task_limit: number; daily_earning: number };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClickTaka — দৈনিক টাকা আয় করুন | Bangladesh #1 Earning Site" },
      { name: "description", content: "ক্লিক করে, অ্যাড দেখে, গেম খেলে দৈনিক ৫০ থেকে ১৩০০ টাকা পর্যন্ত আয় করুন। বিকাশ/নগদে withdraw।" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [packages, setPackages] = useState<Pkg[]>([]);

  useEffect(() => {
    api<{ packages: Pkg[] }>("/packages")
      .then((d) => setPackages(d.packages))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ClickTaka
          </Link>
          <div className="flex gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg">Login</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90">Register</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          দৈনিক <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">৫০ - ১৩০০ টাকা</span><br />
          ঘরে বসে ইনকাম করুন
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Task complete করে, অ্যাড দেখে, গেম খেলে — সরাসরি বিকাশ/নগদে টাকা তুলুন।
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition">
            🚀 এখনই শুরু করুন
          </Link>
          <Link to="/login" className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-xl border-2 border-purple-200 hover:border-purple-400 transition">
            Login
          </Link>
        </div>
      </section>

      {/* Packages */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">আমাদের প্যাকেজসমূহ</h2>
        <p className="text-center text-gray-600 mb-10">যত বড় প্যাকেজ — তত বেশি দৈনিক ইনকাম</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {packages.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-8">প্যাকেজ লোড হচ্ছে... (API connect হলে দেখাবে)</div>
          )}
          {packages.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-6 shadow hover:shadow-xl transition border border-purple-100">
              <h3 className="text-xl font-bold text-purple-600">{p.name}</h3>
              <div className="mt-3 text-3xl font-bold text-gray-900">৳{Number(p.price).toLocaleString()}</div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div>🎯 দৈনিক {p.daily_task_limit} টি task</div>
                <div>💰 দৈনিক ৳{Number(p.daily_earning)}</div>
                <div>📅 {365} দিন valid</div>
              </div>
              <Link to="/register" className="block mt-5 text-center py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium">
                কিনুন
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t bg-white py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ClickTaka. All rights reserved.
      </footer>
    </div>
  );
}
