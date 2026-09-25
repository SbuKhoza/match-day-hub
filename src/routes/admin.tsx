import { Outlet, createFileRoute } from "@tanstack/react-router";

import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AppShell>
      <RequireAdminAuth>
        <Outlet />
      </RequireAdminAuth>
    </AppShell>
  ),
});