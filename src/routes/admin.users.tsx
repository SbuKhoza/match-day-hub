import { createFileRoute } from "@tanstack/react-router";

import { AdminUsersScreen } from "@/screens/admin/AdminUsersScreen";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Manage Users — Kickoff Admin" },
      { name: "description", content: "View, edit and suspend fan accounts." },
      { property: "og:title", content: "Manage Users — Kickoff Admin" },
      { property: "og:description", content: "View, edit and suspend fan accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminUsersScreen,
});
