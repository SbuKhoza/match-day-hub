import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useLive } from "@/hooks/useLive";
import {
  fetchCurrentGameweek,
  fetchFantasyTeam,
  fetchLeague,
  listLeagueTeams,
  listLeagues,
  listPlayerPoints,
  listPlayers,
  listTransfers,
} from "@/services/fantasyService";

export function useFantasyDb() {
  const { services, user } = useAuth();
  return { db: services?.db ?? null, uid: user?.uid ?? null };
}

export function usePlayers() {
  const { db } = useFantasyDb();
  return useQuery({
    queryKey: ["fantasy", "players"],
    queryFn: () => listPlayers(db!),
    enabled: Boolean(db),
    staleTime: 5 * 60_000,
  });
}

export function useFantasyTeam() {
  const { db, uid } = useFantasyDb();
  return useQuery({
    queryKey: ["fantasy", "team", uid],
    queryFn: () => fetchFantasyTeam(db!, uid!),
    enabled: Boolean(db && uid),
  });
}

export function useLeagues() {
  const { db, uid } = useFantasyDb();
  return useQuery({
    queryKey: ["fantasy", "leagues", uid],
    queryFn: () => listLeagues(db!, uid!),
    enabled: Boolean(db && uid),
  });
}

export function useLeague(leagueId: string) {
  const { db } = useFantasyDb();
  return useQuery({
    queryKey: ["fantasy", "league", leagueId],
    queryFn: async () => {
      const league = await fetchLeague(db!, leagueId);
      if (!league) return null;
      const teams = await listLeagueTeams(db!, league.memberUids);
      return { league, teams };
    },
    enabled: Boolean(db && leagueId),
  });
}

export function useTransfers() {
  const { db, uid } = useFantasyDb();
  return useQuery({
    queryKey: ["fantasy", "transfers", uid],
    queryFn: () => listTransfers(db!, uid!),
    enabled: Boolean(db && uid),
  });
}

export function useGameweek() {
  const { db } = useFantasyDb();
  return useQuery({
    queryKey: ["fantasy", "gameweek"],
    queryFn: () => fetchCurrentGameweek(db!),
    enabled: Boolean(db),
  });
}

export function usePlayerPoints(gameweek?: number) {
  const { db } = useFantasyDb();
  const { livePoints, lastUpdated } = useLive();
  const query = useQuery({
    queryKey: ["fantasy", "playerPoints", gameweek ?? "all"],
    queryFn: () => listPlayerPoints(db!, gameweek),
    enabled: Boolean(db),
    refetchInterval: 60_000,
  });

  // Stored points are merged with the in-memory live feed so a goal scored during a
  // match updates fantasy scoring immediately, without a refetch or page refresh.
  const data = useMemo(() => {
    const stored = query.data ?? [];
    const merged = new Map(stored.map((entry) => [`${entry.gameweek}-${entry.playerId}`, entry]));
    for (const entry of livePoints) {
      if (typeof gameweek === "number" && entry.gameweek !== gameweek) continue;
      const key = `${entry.gameweek}-${entry.playerId}`;
      const existing = merged.get(key);
      merged.set(key, existing ? { ...existing, ...entry, points: existing.points + entry.points } : entry);
    }
    return [...merged.values()];
    // lastUpdated keeps the memo in step with each live tick
  }, [query.data, livePoints, gameweek, lastUpdated]);

  return { ...query, data };
}
