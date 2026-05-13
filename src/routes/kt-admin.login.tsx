import { createFileRoute } from "@tanstack/react-router";
import { AdminLogin } from "./kt-admin-login";

export const Route = createFileRoute("/kt-admin/login")({
  head: () => ({ meta: [{ title: "Admin — ClickTaka" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLogin,
});
