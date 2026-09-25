import { createFileRoute } from "@tanstack/react-router";

import { AdminLoginScreen } from "@/screens/admin/AdminLoginScreen";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Kickoff" },
      { name: "description", content: "Sign in to the Kickoff admin portal." },
    ],
  }),
  component: AdminLoginScreen,
});