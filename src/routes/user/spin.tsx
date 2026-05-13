import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/user/spin")({ component: SpinPage });

const SLICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const COLORS = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#0891b2", "#9333ea", "#16a34a", "#ea580c", "#be185d"];

function SpinPage() {
  const [spunToday, setSpunToday] = useState<boolean | null>(null);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [err, setErr] = useState("");

  function loadStatus() {
    api<{ spun_today: boolean; last: { reward: number } | null }>("/user/spin/status")
      .then((r) => { setSpunToday(r.spun_today); setLastReward(r.last ? Number(r.last.reward) : null); })
      .catch((e) => setErr(e.message));
  }
  useEffect(loadStatus, []);

  async function spin() {
    if (spinning || spunToday) return;
    setSpinning(true);
    try {
      const res = await api<{ ok: boolean; reward: number; balance: number }>("/user/spin", { method: "POST" });
      const idx = SLICES.indexOf(res.reward);
      const sliceAngle = 360 / SLICES.length;
      // 5 full turns + land on slice center
      const target = 360 * 5 + (360 - (idx * sliceAngle + sliceAngle / 2));
      setAngle(target);
      setTimeout(() => {
        setSpinning(false);
        setSpunToday(true);
        setLastReward(res.reward);
        toast.success(`🎉 আপনি জিতলেন ৳${res.reward}!`, { duration: 4000 });
      }, 4200);
    } catch (e: any) {
      setSpinning(false);
      toast.error(e.message || "Spin করা যায়নি");
      if (e.message?.includes("ইতিমধ্যে")) setSpunToday(true);
    }
  }

  const sliceAngle = 360 / SLICES.length;
  const gradient = SLICES.map((_, i) => `${COLORS[i]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(", ");

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">🎡 Daily Spin Wheel</h1>
        <p className="text-sm text-gray-600 mt-1">দিনে ১ বার ফ্রি spin — ৳1 থেকে ৳10 পর্যন্ত জিতুন!</p>
      </div>

      {err && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{err}</div>}

      <div className="relative mx-auto" style={{ width: 320, height: 320 }}>
        {/* Pointer */}
        <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg" />
        {/* Wheel */}
        <div
          className="w-full h-full rounded-full shadow-2xl border-8 border-white"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${angle}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.21, 1)" : "none",
          }}
        >
          {SLICES.map((n, i) => {
            const a = i * sliceAngle + sliceAngle / 2;
            return (
              <div
                key={n}
                className="absolute left-1/2 top-1/2 text-white font-bold text-lg select-none"
                style={{
                  transform: `rotate(${a}deg) translateY(-115px) rotate(-${a}deg)`,
                  transformOrigin: "0 0",
                }}
              >
                ৳{n}
              </div>
            );
          })}
        </div>
        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-inner border-4 border-yellow-400 flex items-center justify-center text-2xl">🎁</div>
      </div>

      <div className="text-center">
        <button
          onClick={spin}
          disabled={spinning || spunToday === true || spunToday === null}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
        >
          {spinning ? "🌀 ঘুরছে..." : spunToday ? "✅ আজকের spin শেষ" : "🎯 SPIN NOW"}
        </button>
        {spunToday && lastReward !== null && (
          <p className="mt-3 text-green-600 font-semibold">আজ আপনি জিতেছেন: ৳{lastReward} • কাল আবার আসুন!</p>
        )}
      </div>
    </div>
  );
}
