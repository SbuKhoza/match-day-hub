import { useQuery } from "@tanstack/react-query";

import { useFirestore } from "@/hooks/useMasterData";
import { EMPTY_BRANDING, getBranding } from "@/services/brandingService";

/** Each image is independent: logo, top navigation and bottom navigation never substitute for one another. */
export function useBranding() {
  const { db } = useFirestore();
  const query = useQuery({
    queryKey: ["settings", "branding"],
    queryFn: () => getBranding(db!),
    enabled: Boolean(db),
    staleTime: 5 * 60_000,
  });
  return { branding: query.data ?? EMPTY_BRANDING, isLoading: query.isLoading };
}