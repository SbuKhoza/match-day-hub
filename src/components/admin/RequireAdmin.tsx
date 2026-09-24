import type { ReactNode } from "react";

import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { useIsAdmin } from "@/hooks/useMasterData";

/** Data management is restricted to administrators. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) return <LoadingState label="Checking your access…" />;
  if (!isAdmin) {
    return (
      <EmptyMessage
        title="Administrators only."
        description="This area manages the club and player database and is not available on your account."
      />
    );
  }
  return <>{children}</>;
}
