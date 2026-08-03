import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { VideosScreen } from "@/screens/VideosScreen";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Videos — Kickoff" },
      { name: "description", content: "Highlights, interviews and behind-the-scenes footage." },
      { property: "og:title", content: "Videos — Kickoff" },
      {
        property: "og:description",
        content: "Highlights, interviews and behind-the-scenes footage.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppShell>
        <VideosScreen />
      </AppShell>
    </RequireAuth>
  ),
});