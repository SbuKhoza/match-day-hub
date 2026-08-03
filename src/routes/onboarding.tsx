import { createFileRoute } from "@tanstack/react-router";

import { OnboardingScreen } from "@/screens/OnboardingScreen";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Choose your club — Kickoff" },
      { name: "description", content: "Pick a favourite team to personalise your Kickoff feed." },
      { property: "og:title", content: "Choose your club — Kickoff" },
      {
        property: "og:description",
        content: "Pick a favourite team to personalise your Kickoff feed.",
      },
    ],
  }),
  component: OnboardingScreen,
});