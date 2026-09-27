import { createFileRoute } from "@tanstack/react-router";

import { AdminStaffScreen } from "@/screens/admin/AdminStaffScreen";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({
    meta: [
      { title: "Manage Staff — Kickoff Admin" },
      {
        name: "description",
        content: "Add, edit and remove managers, coaches and other club staff.",
      },
      { property: "og:title", content: "Manage Staff — Kickoff Admin" },
      {
        property: "og:description",
        content: "Add, edit and remove managers, coaches and other club staff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminStaffScreen,
});