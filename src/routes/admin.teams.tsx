import { createFileRoute } from "@tanstack/react-router";

import { AdminTeamsScreen } from "@/screens/admin/AdminTeamsScreen";

export const Route = createFileRoute("/admin/teams")({
  head: () => ({
    meta: [
      { title: "Manage Clubs — Kickoff Admin" },
      { name: "description", content: "Add, edit and remove clubs." },
      { property: "og:title", content: "Manage Clubs — Kickoff Admin" },
      { property: "og:description", content: "Add, edit and remove clubs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTeamsScreen,
});
