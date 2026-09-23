import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PlayerProfileScreen } from "@/screens/PlayerProfileScreen";

const title = "Player Profile — Kickoff Fantasy";
const description =
  "Club, position, shirt number and season statistics for a Premier Soccer League player.";

export const Route = createFileRoute("/players/$playerId")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlayerRoute,
});

function PlayerRoute() {
  const { playerId } = Route.useParams();
  return (
    <RequireAuth>
      <AppShell>
        <PlayerProfileScreen playerId={playerId} />
      </AppShell>
    </RequireAuth>
  );
}
