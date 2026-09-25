import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/common/Button";
import { EmptyMessage } from "@/components/common/DataState";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useMasterData";

/**
 * Client-side session gate for the fan-facing app. Administrators are sent to
 * the admin area instead — they manage the app rather than play it.
 */
export function RequireAuth({
  children,
  requireOnboarding = true,
}: {
  children: ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, profile, loading, logout } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (adminLoading) return;
    if (isAdmin) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    if (requireOnboarding && profile && !profile.favoriteTeam && !profile.disabled) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, user, profile, requireOnboarding, navigate, isAdmin, adminLoading]);

  if (loading || !user || adminLoading || isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (profile?.disabled) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16">
        <EmptyMessage
          title="This account has been suspended."
          description="Contact the Kickoff team if you think this is a mistake."
        />
        <Button onClick={() => void logout()}>Sign out</Button>
      </div>
    );
  }

  return <>{children}</>;
}
