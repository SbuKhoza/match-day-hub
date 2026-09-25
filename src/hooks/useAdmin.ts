import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useFirestore } from "@/hooks/useMasterData";
import {
  DEFAULT_SETTINGS,
  getFantasySettings,
  listNews,
  listUsers,
  listVideos,
} from "@/services/adminService";

export function useFantasySettings() {
  const { db } = useFirestore();
  const query = useQuery({
    queryKey: ["settings", "fantasy"],
    queryFn: () => getFantasySettings(db!),
    enabled: Boolean(db),
    staleTime: 5 * 60_000,
  });
  return { settings: query.data ?? DEFAULT_SETTINGS, budget: (query.data ?? DEFAULT_SETTINGS).budget, isLoading: query.isLoading };
}

export function useAdminNews() {
  const { db } = useFirestore();
  return useQuery({ queryKey: ["news"], queryFn: () => listNews(db!), enabled: Boolean(db) });
}

export function useAdminVideos() {
  const { db } = useFirestore();
  return useQuery({ queryKey: ["videos"], queryFn: () => listVideos(db!), enabled: Boolean(db) });
}

export function useAdminUsers() {
  const { db } = useFirestore();
  return useQuery({ queryKey: ["admin", "users"], queryFn: () => listUsers(db!), enabled: Boolean(db) });
}

/** Runs an admin write then refreshes the given cache keys. */
export function useAdminAction<T>(fn: (input: T) => Promise<void>, invalidate: string[][]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => client.invalidateQueries({ queryKey })));
    },
  });
}
