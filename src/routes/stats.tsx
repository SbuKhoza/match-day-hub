import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { StatsScreen } from "@/screens/StatsScreen";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistics — Kickoff" },
      {
        name: "description",
        content: "Top scorers and assists across the Premier Soccer League season.",
      },
      { property: "og:title", content: "Statistics — Kickoff" },
      {
        property: "og:description",
        content: "Top scorers and assists across the Premier Soccer League season.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <StatsScreen />
      </AppShell>
    </RequireAuth>
  ),
});