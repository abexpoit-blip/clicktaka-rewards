import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user/withdraw")({ component: WithdrawPage });

function WithdrawPage() {
  return <div className="rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Withdraw</h1><p className="mt-2 text-gray-600">Withdraw request feature শিগগিরই চালু হবে।</p></div>;
}