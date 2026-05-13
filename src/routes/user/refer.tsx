import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Users, Copy, Share2, Gift, TrendingUp, Link2, Check,
  Sparkles, Crown, Trophy, MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/user/refer")({ component: ReferPage });

type Referral = { id: number; commission: number; created_at: string; phone: string; name: string | null };

function ReferPage() {
  const [data, setData] = useState<{ referrals: Referral[]; refer_code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    api<{ referrals: Referral[]; refer_code: string }>("/user/referrals")
      .then(setData)
      .catch(() => setData({ referrals: [], refer_code: "" }))
      .finally(() => setLoading(false));
  }, []);

  const referLink = useMemo(() => {
    if (!data?.refer_code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://clicktaka24.com";
    return `${origin}/register?ref=${data.refer_code}`;
  }, [data?.refer_code]);

  const stats = useMemo(() => {
    const total = data?.referrals.length ?? 0;
    const earned = (data?.referrals ?? []).reduce((s, r) => s + Number(r.commission || 0), 0);
    const today = (data?.referrals ?? []).filter((r) => {
      const d = new Date(r.created_at);
      const t = new Date();
      return d.toDateString() === t.toDateString();
    }).length;
    return { total, earned, today };
  }, [data]);

  function copy(text: string, kind: "code" | "link") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      toast.success(kind === "code" ? "Refer code কপি হয়েছে!" : "লিংক কপি হয়েছে!");
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function shareWA() {
    const msg = `🎉 ClickTaka তে join করুন আর প্রতিদিন আয় করুন!\nআমার Refer Code: ${data?.refer_code}\n${referLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Refer & Earn 10% Commission
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">
            বন্ধু আনুন,<br />প্রতি Deposit-এ <span className="text-amber-200">৳ আয় করুন</span>
          </h1>
          <p className="mt-2 text-sm text-white/80 max-w-md">
            আপনার Refer Code দিয়ে যত বন্ধু signup করবে, তাদের প্রতিটি deposit থেকে আপনি commission পাবেন আজীবন।
          </p>
        </div>
      </div>

      {/* Refer Code Card */}
      <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <Crown className="h-4 w-4 text-amber-500" /> আপনার Refer Code
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 rounded-2xl border-2 border-dashed border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-4">
            <p className="text-3xl font-bold tracking-widest text-violet-700 font-mono">
              {data?.refer_code || "—"}
            </p>
          </div>
          <button
            onClick={() => copy(data?.refer_code || "", "code")}
            className="h-[68px] aspect-square rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white grid place-items-center shadow-lg hover:shadow-xl transition active:scale-95"
          >
            {copied === "code" ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 p-2">
          <Link2 className="h-4 w-4 text-gray-400 ml-2 shrink-0" />
          <p className="flex-1 text-xs text-gray-600 truncate font-mono">{referLink}</p>
          <button
            onClick={() => copy(referLink, "link")}
            className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 inline-flex items-center gap-1"
          >
            {copied === "link" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={shareWA} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white py-3 text-sm font-semibold transition">
            <MessageCircle className="h-4 w-4" /> WhatsApp Share
          </button>
          <button
            onClick={() => {
              if (navigator.share) navigator.share({ title: "ClickTaka", text: "Join ClickTaka", url: referLink });
              else copy(referLink, "link");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 hover:bg-black text-white py-3 text-sm font-semibold transition"
          >
            <Share2 className="h-4 w-4" /> Share Link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <ReferStat icon={Users} label="মোট Referrals" value={stats.total} from="from-blue-500" to="to-cyan-500" />
        <ReferStat icon={Gift} label="আজকের নতুন" value={stats.today} from="from-violet-500" to="to-fuchsia-500" />
        <ReferStat icon={TrendingUp} label="Total Earned" value={`৳${stats.earned.toFixed(0)}`} from="from-emerald-500" to="to-teal-500" />
      </div>

      {/* How it works */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-600" /> কীভাবে কাজ করে?</h3>
        <ol className="mt-3 space-y-2 text-sm text-gray-700">
          {[
            "আপনার Refer Code/Link বন্ধুকে শেয়ার করুন",
            "বন্ধু সেই code দিয়ে account খুলুক",
            "তার প্রতিটি deposit থেকে আপনি 10% commission পাবেন",
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid place-items-center h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs font-bold shrink-0">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      {/* Referrals list */}
      <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">আপনার Referrals</h3>
          <span className="text-xs text-gray-500">{data?.referrals.length ?? 0} জন</span>
        </div>
        {data?.referrals.length ? (
          <ul className="divide-y divide-gray-100">
            {data.referrals.map((r, i) => (
              <li key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="grid place-items-center h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold text-sm shrink-0">
                  {(r.name || r.phone)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.name || r.phone}</p>
                  <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("bn-BD")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">+৳{Number(r.commission).toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">#{i + 1}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">এখনও কোনো referral নেই</p>
            <p className="text-xs text-gray-400 mt-1">এখনই code শেয়ার করে আয় শুরু করুন</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReferStat({ icon: Icon, label, value, from, to }: { icon: any; label: string; value: number | string; from: string; to: string }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
      <div className={`inline-grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br ${from} ${to} text-white shadow-md`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
    </div>
  );
}
