import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";

/** Client-side session gate: Firebase auth state only exists in the browser. */
export function RequireAuth({
  children,
  requireOnboarding = true,
}: {
  children: ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (requireOnboarding && profile && !profile.favoriteTeam) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, user, profile, requireOnboarding, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}