import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RequireAdminAuth>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </RequireAdminAuth>
  ),
});
