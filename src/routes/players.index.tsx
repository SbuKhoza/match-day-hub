import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PlayersScreen } from "@/screens/PlayersScreen";

const title = "PSL Players — Kickoff Fantasy";
const description =
  "Browse the imported Premier Soccer League player database and filter by club, position and price.";

export const Route = createFileRoute("/players/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <PlayersScreen />
      </AppShell>
    </RequireAuth>
  ),
});
