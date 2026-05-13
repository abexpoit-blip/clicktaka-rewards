import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user/deposit")({ component: DepositPage });

function DepositPage() {
  return <ComingSoon title="Deposit" description="Deposit request feature শিগগিরই চালু হবে।" />;
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-2 text-gray-600">{description}</p></div>;
}