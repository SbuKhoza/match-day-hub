import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboardScreen } from "@/screens/admin/AdminDashboardScreen";

const description = "Manage the club and player database and review import history.";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Data Management — Kickoff" },
      { name: "description", content: description },
      { property: "og:title", content: "Data Management — Kickoff" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboardScreen,
});
