import { createFileRoute } from "@tanstack/react-router";

import { LeaguesScreen } from "@/screens/fantasy/LeaguesScreen";

export const Route = createFileRoute("/fantasy/leagues/")({
  head: () => ({
    meta: [
      { title: "Fantasy Leagues — Kickoff" },
      { name: "description", content: "Create a mini-league, share an invite code or join your friends." },
      { property: "og:title", content: "Fantasy Leagues — Kickoff" },
      { property: "og:description", content: "Create a mini-league, share an invite code or join your friends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaguesScreen,
});
