import { createFileRoute } from "@tanstack/react-router";

import { TransfersScreen } from "@/screens/fantasy/TransfersScreen";

export const Route = createFileRoute("/fantasy/transfers")({
  head: () => ({
    meta: [
      { title: "Transfers — Kickoff Fantasy" },
      { name: "description", content: "Swap fantasy players in and out within your remaining budget." },
      { property: "og:title", content: "Transfers — Kickoff Fantasy" },
      { property: "og:description", content: "Swap fantasy players in and out within your remaining budget." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransfersScreen,
});
