import { createFileRoute } from "@tanstack/react-router";

import { AdminNewsScreen } from "@/screens/admin/AdminNewsScreen";

export const Route = createFileRoute("/admin/news")({
  head: () => ({
    meta: [
      { title: "Manage News — Kickoff Admin" },
      { name: "description", content: "Publish and edit news articles." },
      { property: "og:title", content: "Manage News — Kickoff Admin" },
      { property: "og:description", content: "Publish and edit news articles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNewsScreen,
});
