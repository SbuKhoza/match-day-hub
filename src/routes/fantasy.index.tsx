import { createFileRoute } from "@tanstack/react-router";

import { FantasyScreen } from "@/screens/FantasyScreen";

export const Route = createFileRoute("/fantasy/")({
  head: () => ({
    meta: [
      { title: "Fantasy Dashboard — Kickoff" },
      { name: "description", content: "Your fantasy squad, leagues, transfers, points and gameweek." },
      { property: "og:title", content: "Fantasy Dashboard — Kickoff" },
      { property: "og:description", content: "Your fantasy squad, leagues, transfers, points and gameweek." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FantasyScreen,
});
