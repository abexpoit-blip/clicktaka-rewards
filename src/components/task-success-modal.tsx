// Celebratory full-screen popup shown when a task is successfully claimed.
// Includes confetti burst, scale-in animation, and auto-dismiss.
import { useEffect } from "react";
import { CheckCircle2, Sparkles, Coins, X } from "lucide-react";

type Props = {
  open: boolean;
  reward: number;
  taskTitle?: string;
  newBalance?: number | null;
  onClose: () => void;
};

export function TaskSuccessModal({ open, reward, taskTitle, newBalance, onClose }: Props) {
  // Auto-dismiss after 3.5s
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  // 24 confetti pieces with deterministic random spread
  const confetti = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const dist = 120 + (i % 4) * 25;
    const colors = ["#22c55e", "#facc15", "#ec4899", "#3b82f6", "#a855f7", "#f97316"];
    return { angle, dist, color: colors[i % colors.length], delay: (i % 6) * 0.04 };
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />

      {/* Card */}
      <div
        className="relative w-[calc(100%-1rem)] max-w-sm rounded-2xl sm:rounded-3xl bg-card shadow-2xl border border-border overflow-hidden animate-[popIn_0.45s_cubic-bezier(0.34,1.56,0.64,1)] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti burst from center */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-visible">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
            {confetti.map((c, i) => (
              <span
                key={i}
                className="absolute block h-2 w-2 rounded-sm opacity-0"
                style={{
                  background: c.color,
                  animation: `confettiBurst 1.4s cubic-bezier(0.2,0.6,0.4,1) ${c.delay}s forwards`,
                  // CSS variables consumed by keyframes
                  ['--ang' as any]: `${c.angle}deg`,
                  ['--dist' as any]: `${c.dist}px`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Top gradient banner with check */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white px-6 pt-8 pb-6 text-center overflow-hidden">
          <div aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div aria-hidden className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 grid place-items-center h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative mx-auto grid place-items-center h-20 w-20 rounded-full bg-white shadow-2xl animate-[checkPop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.15s_both]">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={2.5} />
          </div>

          <p className="relative mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
            <Sparkles className="inline h-3 w-3 mr-1" /> Task Complete
          </p>
          <h2 className="relative font-display text-2xl font-bold mt-1">অভিনন্দন! 🎉</h2>
        </div>

        {/* Reward body */}
        <div className="px-6 py-6 text-center space-y-4">
          {taskTitle && (
            <p className="text-sm text-muted-foreground line-clamp-2">{taskTitle}</p>
          )}

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">আপনি পেলেন</p>
            <p className="font-display text-4xl font-bold tabular-nums text-emerald-600 mt-1 inline-flex items-center gap-1.5">
              <Coins className="h-7 w-7" /> +৳{Number(reward).toFixed(0)}
            </p>
          </div>

          {typeof newBalance === "number" && (
            <p className="text-xs text-muted-foreground">
              নতুন Balance: <b className="text-foreground tabular-nums">৳{newBalance.toLocaleString()}</b>
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 hover:scale-[1.02] transition shadow-lg"
          >
            চালিয়ে যান →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.8) translateY(10px); }
          60%  { opacity: 1; transform: scale(1.03) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes confettiBurst {
          0%   { opacity: 1; transform: rotate(var(--ang)) translateX(0) rotate(calc(var(--ang) * -1)); }
          100% { opacity: 0; transform: rotate(var(--ang)) translateX(var(--dist)) rotate(calc(var(--ang) * -1 + 720deg)); }
        }
      `}</style>
    </div>
  );
}
