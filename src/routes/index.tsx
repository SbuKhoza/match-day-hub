import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { HomeScreen } from "@/screens/HomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Kickoff Fantasy Football" },
      {
        name: "description",
        content: "Your personalised football dashboard: live scores, news and highlights.",
      },
      { property: "og:title", content: "Home — Kickoff Fantasy Football" },
      {
        property: "og:description",
        content: "Your personalised football dashboard: live scores, news and highlights.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <RequireAuth>
      <AppShell>
        <HomeScreen />
      </AppShell>
    </RequireAuth>
  );
}
