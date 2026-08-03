import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { MatchCenterScreen } from "@/screens/MatchCenterScreen";

export const Route = createFileRoute("/match-center")({
  head: () => ({
    meta: [
      { title: "Match Center — Kickoff" },
      { name: "description", content: "Live scores, fixtures and results for your club." },
      { property: "og:title", content: "Match Center — Kickoff" },
      { property: "og:description", content: "Live scores, fixtures and results for your club." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <MatchCenterScreen />
      </AppShell>
    </RequireAuth>
  ),
});