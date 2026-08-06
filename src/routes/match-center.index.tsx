import { createFileRoute } from "@tanstack/react-router";

import { MatchCenterScreen } from "@/screens/MatchCenterScreen";

export const Route = createFileRoute("/match-center/")({
  head: () => ({
    meta: [
      { title: "Match Center — Kickoff" },
      {
        name: "description",
        content: "Live scores, results, fixtures and the Betway Premiership table.",
      },
      { property: "og:title", content: "Match Center — Kickoff" },
      {
        property: "og:description",
        content: "Live scores, results, fixtures and the Betway Premiership table.",
      },
    ],
  }),
  component: MatchCenterScreen,
});
