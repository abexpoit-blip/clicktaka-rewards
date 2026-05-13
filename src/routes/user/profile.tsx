import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/user/profile")({ component: ProfilePage });

type User = { phone: string; name: string | null; balance: number; refer_code: string };

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api<{ user: User }>("/user/me").then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  return <div className="rounded-xl bg-white p-6 shadow"><h1 className="text-2xl font-bold">Profile</h1><p className="mt-3 text-gray-700">Name: {user?.name || "—"}</p><p className="text-gray-700">Phone: {user?.phone || "—"}</p><p className="text-gray-700">Balance: ৳{Number(user?.balance || 0).toLocaleString()}</p></div>;
}