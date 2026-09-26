import { createFileRoute } from "@tanstack/react-router";

import { AdminVideosScreen } from "@/screens/admin/AdminVideosScreen";

export const Route = createFileRoute("/admin/videos")({
  head: () => ({
    meta: [
      { title: "Manage Videos — Kickoff Admin" },
      { name: "description", content: "Publish and edit videos." },
      { property: "og:title", content: "Manage Videos — Kickoff Admin" },
      { property: "og:description", content: "Publish and edit videos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminVideosScreen,
});
