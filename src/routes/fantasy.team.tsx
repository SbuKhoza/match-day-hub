import { createFileRoute } from "@tanstack/react-router";

import { TeamBuilderScreen } from "@/screens/fantasy/TeamBuilderScreen";

export const Route = createFileRoute("/fantasy/team")({
  head: () => ({
    meta: [
      { title: "Team Builder — Kickoff Fantasy" },
      { name: "description", content: "Pick 17 PSL players inside your R100m fantasy budget." },
      { property: "og:title", content: "Team Builder — Kickoff Fantasy" },
      { property: "og:description", content: "Pick 17 PSL players inside your R100m fantasy budget." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamBuilderScreen,
});
