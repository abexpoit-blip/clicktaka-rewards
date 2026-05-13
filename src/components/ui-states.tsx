// Shared loading / empty / error UI for dashboards
import { Link } from "@tanstack/react-router";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-[shimmer_1.4s_infinite] rounded ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function ErrorState({ message, onRetry, dark }: { message: string; onRetry?: () => void; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-8 text-center ${dark ? "bg-red-950/30 border border-red-800 text-red-200" : "bg-red-50 border border-red-200 text-red-700"}`}>
      <div className="text-4xl mb-2">⚠️</div>
      <h3 className="font-bold text-lg mb-1">Data load করা যাচ্ছে না</h3>
      <p className="text-sm opacity-80 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
          🔄 আবার চেষ্টা করুন
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = "📭", title, description, action }: { icon?: string; title: string; description?: string; action?: { label: string; to: string } }) {
  return (
    <div className="rounded-xl p-8 text-center bg-white/50 border-2 border-dashed border-slate-300">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      {action && (
        <Link to={action.to} className="inline-block mt-4 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold">
          {action.label}
        </Link>
      )}
    </div>
  );
}
