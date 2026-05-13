import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_user/dashboard")({ component: Dashboard });

type Pkg = { id: number; name: string; expires_at: string; tasks_done_today: number; daily_task_limit: number; daily_earning: number };

function Dashboard() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => { api("/user/me").then(setMe).catch(() => {}); }, []);
  if (!me) return <div>লোডিং...</div>;

  const u = me.user;
  const pkgs: Pkg[] = me.packages || [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-sm opacity-80">স্বাগতম</p>
        <h1 className="text-2xl font-bold">{u.name || u.phone}</h1>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-xs opacity-80">Balance</p>
            <p className="text-3xl font-bold">৳{Number(u.balance).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Refer Code</p>
            <p className="text-xl font-mono">{u.refer_code}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">আপনার Active প্যাকেজ</h2>
        {pkgs.length === 0 ? (
          <div className="bg-white p-6 rounded-xl text-center text-gray-500">
            কোন active package নেই। <a href="/user/packages" className="text-purple-600 font-medium">প্যাকেজ কিনুন →</a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {pkgs.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-xl shadow">
                <h3 className="font-bold text-purple-600">{p.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Expires: {new Date(p.expires_at).toLocaleDateString()}</p>
                <p className="text-sm mt-2">আজকের progress: <b>{p.tasks_done_today}/{p.daily_task_limit}</b></p>
                <p className="text-sm">দৈনিক ইনকাম: <b className="text-green-600">৳{p.daily_earning}</b></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
