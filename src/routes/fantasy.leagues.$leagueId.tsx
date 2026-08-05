import { createFileRoute } from "@tanstack/react-router";

import { LeagueDetailScreen } from "@/screens/fantasy/LeagueDetailScreen";

export const Route = createFileRoute("/fantasy/leagues/$leagueId")({
  head: () => ({
    meta: [
      { title: "League Table — Kickoff Fantasy" },
      { name: "description", content: "Weekly and overall standings, captain picks and transfers." },
      { property: "og:title", content: "League Table — Kickoff Fantasy" },
      { property: "og:description", content: "Weekly and overall standings, captain picks and transfers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeagueDetailRoute,
});

function LeagueDetailRoute() {
  const { leagueId } = Route.useParams();
  return <LeagueDetailScreen leagueId={leagueId} />;
}
