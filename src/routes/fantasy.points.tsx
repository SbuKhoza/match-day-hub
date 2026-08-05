import { createFileRoute } from "@tanstack/react-router";

import { PointsScreen } from "@/screens/fantasy/PointsScreen";

export const Route = createFileRoute("/fantasy/points")({
  head: () => ({
    meta: [
      { title: "Fantasy Points — Kickoff" },
      { name: "description", content: "Live gameweek points, captain bonus, bench and scoring rules." },
      { property: "og:title", content: "Fantasy Points — Kickoff" },
      { property: "og:description", content: "Live gameweek points, captain bonus, bench and scoring rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PointsScreen,
});
