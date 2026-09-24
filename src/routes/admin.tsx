import { Outlet, createFileRoute } from "@tanstack/react-router";

import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <RequireAdmin>
          <Outlet />
        </RequireAdmin>
      </AppShell>
    </RequireAuth>
  ),
});
