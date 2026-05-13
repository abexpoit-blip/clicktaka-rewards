import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/user/refer")({ component: ReferPage });

type Referral = { id: number; commission: number; created_at: string; phone: string; name: string | null };

function ReferPage() {
  const [data, setData] = useState<{ referrals: Referral[]; refer_code: string } | null>(null);

  useEffect(() => {
    api<{ referrals: Referral[]; refer_code: string }>("/user/referrals").then(setData).catch(() => setData({ referrals: [], refer_code: "" }));
  }, []);

  return <div className="rounded-xl bg-white p-6 shadow"><h1 className="text-2xl font-bold">Refer</h1><p className="mt-2 text-sm text-gray-600">আপনার refer code: <b>{data?.refer_code || "—"}</b></p><p className="mt-4 text-gray-600">Total referrals: {data?.referrals.length ?? 0}</p></div>;
}