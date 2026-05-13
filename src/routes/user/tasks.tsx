import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/user/tasks")({ component: TasksPage });

type Task = { id: number; title: string; type: string; url: string | null; reward: number };
type Pkg = { id: number; name: string; tasks_done_today: number; daily_task_limit: number; daily_earning: number; expires_at: string };
type Data = {
  tasks: Task[];
  packages: Pkg[];
  completed_task_ids_today: number[];
  today_completed: number;
  daily_limit: number;
};

function TasksPage() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [active, setActive] = useState<{ task: Task; remaining: number } | null>(null);

  function load() {
    api<Data>("/user/tasks").then(setD).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  // Countdown timer for "current task"
  useEffect(() => {
    if (!active) return;
    if (active.remaining <= 0) return;
    const t = setTimeout(() => setActive((a) => (a ? { ...a, remaining: a.remaining - 1 } : a)), 1000);
    return () => clearTimeout(t);
  }, [active]);

  async function startTask(task: Task) {
    if (task.url) window.open(task.url, "_blank", "noopener");
    setActive({ task, remaining: 15 });
  }

  async function complete(task: Task) {
    setBusy(task.id);
    try {
      const r = await api<{ ok: boolean; reward: number }>(`/user/tasks/${task.id}/complete`, { method: "POST" });
      alert(`+৳${r.reward} যোগ হয়েছে ✅`);
      setActive(null);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (err) return <div className="text-red-600">{err}</div>;
  if (!d) return <div>লোডিং...</div>;

  const done = new Set(d.completed_task_ids_today);
  const limitReached = d.daily_limit > 0 && d.today_completed >= d.daily_limit;
  const pct = d.daily_limit > 0 ? Math.min(100, Math.round((d.today_completed / d.daily_limit) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Daily limit progress */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">আজকের টাস্ক প্রগ্রেস</p>
            <p className="text-3xl font-bold mt-1">{d.today_completed} / {d.daily_limit || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Available</p>
            <p className="text-2xl font-bold">{d.tasks.length}</p>
          </div>
        </div>
        <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {d.packages.length === 0 && (
          <p className="mt-3 text-sm bg-white/15 rounded-lg p-2">
            Active package নেই —{" "}
            <Link to="/user/packages" className="underline font-semibold">প্যাকেজ কিনুন</Link>
          </p>
        )}
      </div>

      {/* Active package breakdown */}
      {d.packages.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">আপনার Active প্যাকেজ</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {d.packages.map((p) => {
              const ppct = Math.min(100, Math.round((p.tasks_done_today / Math.max(p.daily_task_limit, 1)) * 100));
              return (
                <div key={p.id} className="bg-white rounded-xl shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-purple-600">{p.name}</h3>
                      <p className="text-xs text-gray-500">Expires: {new Date(p.expires_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">৳{p.daily_earning}/দিন</span>
                  </div>
                  <p className="text-sm mt-3">{p.tasks_done_today}/{p.daily_task_limit} টাস্ক</p>
                  <div className="h-2 mt-1 bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: `${ppct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Current active task */}
      {active && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-800 uppercase">▶ Current Task</p>
          <h3 className="text-lg font-bold mt-1">{active.task.title}</h3>
          <p className="text-sm text-gray-600">Reward: ৳{active.task.reward}</p>
          {active.remaining > 0 ? (
            <div className="mt-3">
              <p className="text-2xl font-bold text-amber-700">{active.remaining}s</p>
              <p className="text-xs text-gray-600">দয়া করে ad-টি দেখুন...</p>
            </div>
          ) : (
            <button
              onClick={() => complete(active.task)}
              disabled={busy === active.task.id}
              className="mt-3 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {busy === active.task.id ? "Saving..." : "✅ Reward নিন"}
            </button>
          )}
          <button onClick={() => setActive(null)} className="ml-2 text-sm text-gray-500 hover:underline">বাতিল</button>
        </div>
      )}

      {/* Available tasks list */}
      <section>
        <h2 className="text-lg font-semibold mb-3">উপলব্ধ টাস্ক / অ্যাড</h2>
        {d.tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            এই মুহূর্তে কোনো task নেই।
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {d.tasks.map((t) => {
              const isDone = done.has(t.id);
              const disabled = isDone || limitReached || d.packages.length === 0 || active !== null;
              return (
                <div key={t.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{t.type} • +৳{t.reward}</p>
                  </div>
                  <button
                    onClick={() => startTask(t)}
                    disabled={disabled}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
                      isDone
                        ? "bg-gray-200 text-gray-500"
                        : disabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                  >
                    {isDone ? "✓ Done" : limitReached ? "Limit শেষ" : "Start"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
