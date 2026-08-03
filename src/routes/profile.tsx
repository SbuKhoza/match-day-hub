import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileScreen } from "@/screens/ProfileScreen";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Kickoff" },
      { name: "description", content: "Manage your account, favourite club and theme." },
      { property: "og:title", content: "Profile — Kickoff" },
      { property: "og:description", content: "Manage your account, favourite club and theme." },
    ],
  }),
  component: () => (
    <RequireAuth requireOnboarding={false}>
      <AppShell>
        <ProfileScreen />
      </AppShell>
    </RequireAuth>
  ),
});