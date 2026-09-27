import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PlayerBySlugScreen } from "@/screens/PlayerBySlugScreen";

const title = "Player Profile — Kickoff Fantasy";
const description = "Season statistics for a Premier Soccer League player.";

export const Route = createFileRoute("/players/provider/$slug")({
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
  const { slug } = Route.useParams();
  return (
    <RequireAuth>
      <AppShell>
        <PlayerBySlugScreen slug={slug} />
      </AppShell>
    </RequireAuth>
  );
}