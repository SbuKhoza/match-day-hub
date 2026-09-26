import { createFileRoute } from "@tanstack/react-router";

import { AdminPlayersScreen } from "@/screens/admin/AdminPlayersScreen";

export const Route = createFileRoute("/admin/players")({
  head: () => ({
    meta: [
      { title: "Manage Players — Kickoff Admin" },
      { name: "description", content: "Add, edit and remove players and fantasy prices." },
      { property: "og:title", content: "Manage Players — Kickoff Admin" },
      { property: "og:description", content: "Add, edit and remove players and fantasy prices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPlayersScreen,
});
