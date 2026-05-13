import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/user/packages")({ component: PackagesPage });

type Package = { id: number; name: string; price: number; daily_task_limit: number; daily_earning: number; validity_days: number };

function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ packages: Package[] }>("/packages")
      .then((d) => setPackages(d.packages || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>লোডিং...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">প্যাকেজ</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {packages.map((p) => (
          <div key={p.id} className="rounded-xl bg-white p-4 shadow">
            <h2 className="font-bold text-purple-600">{p.name}</h2>
            <p className="mt-1 text-2xl font-bold">৳{Number(p.price).toLocaleString()}</p>
            <p className="mt-2 text-sm text-gray-600">দিনে {p.daily_task_limit} task • ৳{p.daily_earning}/দিন • {p.validity_days} দিন</p>
          </div>
        ))}
      </div>
      <Link to="/user/dashboard" className="inline-block text-sm font-medium text-purple-600">← Dashboard</Link>
    </div>
  );
}