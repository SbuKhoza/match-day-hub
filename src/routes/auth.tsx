import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/screens/AuthScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Kickoff" },
      { name: "description", content: "Sign in or create your Kickoff fantasy football account." },
      { property: "og:title", content: "Sign in — Kickoff" },
      {
        property: "og:description",
        content: "Sign in or create your Kickoff fantasy football account.",
      },
    ],
  }),
  component: AuthScreen,
});