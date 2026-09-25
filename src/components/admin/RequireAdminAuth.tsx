import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useMasterData";

/** Gate for everything under /admin: must be signed in AND listed in the admins collection. */
export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/admin-login", replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (adminLoading) return <LoadingState label="Checking your access…" />;

  if (!isAdmin) {
    return (
      <EmptyMessage
        title="Administrators only."
        description="This account is signed in but isn't listed as an administrator."
      />
    );
  }

  return <>{children}</>;
}