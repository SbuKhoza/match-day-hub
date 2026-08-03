import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { FantasyScreen } from "@/screens/FantasyScreen";

export const Route = createFileRoute("/fantasy")({
  head: () => ({
    meta: [
      { title: "Fantasy — Kickoff" },
      { name: "description", content: "Manage your fantasy squad, transfers and mini-leagues." },
      { property: "og:title", content: "Fantasy — Kickoff" },
      {
        property: "og:description",
        content: "Manage your fantasy squad, transfers and mini-leagues.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <FantasyScreen />
      </AppShell>
    </RequireAuth>
  ),
});