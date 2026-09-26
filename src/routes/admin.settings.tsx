import { createFileRoute } from "@tanstack/react-router";

import { AdminSettingsScreen } from "@/screens/admin/AdminSettingsScreen";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Fantasy Settings — Kickoff Admin" },
      { name: "description", content: "Set the fantasy squad budget." },
      { property: "og:title", content: "Fantasy Settings — Kickoff Admin" },
      { property: "og:description", content: "Set the fantasy squad budget." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSettingsScreen,
});
