import { createFileRoute } from "@tanstack/react-router";

import { DataImportScreen } from "@/screens/admin/DataImportScreen";

const description = "Upload the clubs and players export, review the changes, then confirm the import.";

export const Route = createFileRoute("/admin/import")({
  head: () => ({
    meta: [
      { title: "Import Clubs & Players — Kickoff" },
      { name: "description", content: description },
      { property: "og:title", content: "Import Clubs & Players — Kickoff" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataImportScreen,
});
