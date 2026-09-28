import { createFileRoute } from "@tanstack/react-router";

import { LineupScreen } from "@/screens/fantasy/LineupScreen";

export const Route = createFileRoute("/fantasy/lineup")({
  head: () => ({
    meta: [
      { title: "My Line-up — Kickoff Fantasy" },
      { name: "description", content: "Choose which of your squad play in the next gameweek." },
      { property: "og:title", content: "My Line-up — Kickoff Fantasy" },
      {
        property: "og:description",
        content: "Choose which of your squad play in the next gameweek.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LineupScreen,
});