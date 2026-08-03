import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { NewsScreen } from "@/screens/NewsScreen";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — Kickoff" },
      { name: "description", content: "Match reports, transfer news and tactical analysis." },
      { property: "og:title", content: "News — Kickoff" },
      {
        property: "og:description",
        content: "Match reports, transfer news and tactical analysis.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <NewsScreen />
      </AppShell>
    </RequireAuth>
  ),
});