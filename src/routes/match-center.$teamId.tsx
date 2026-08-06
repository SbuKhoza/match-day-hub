import { createFileRoute } from "@tanstack/react-router";

import { TeamMatchCenterScreen } from "@/screens/TeamMatchCenterScreen";

export const Route = createFileRoute("/match-center/$teamId")({
  head: () => ({
    meta: [
      { title: "Club Match Center — Kickoff" },
      { name: "description", content: "Live games, results, fixtures and form for this club." },
      { property: "og:title", content: "Club Match Center — Kickoff" },
      {
        property: "og:description",
        content: "Live games, results, fixtures and form for this club.",
      },
    ],
  }),
  component: TeamRoute,
});

function TeamRoute() {
  const { teamId } = Route.useParams();
  return <TeamMatchCenterScreen teamId={teamId} />;
}
