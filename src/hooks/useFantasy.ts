import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { usePlayers as useMasterPlayers, useTeams } from "@/hooks/useMasterData";
import { useFantasySettings } from "@/hooks/useAdmin";
import { listGameweeks, resolveEditTarget, seasonHalfFor } from "@/services/gameweekService";
import { toFantasyPlayers } from "@/services/fantasyPool";
import {
  fetchCurrentGameweek,
  fetchFantasyTeam,
  fetchLeague,
  listLeagueTeams,
  listLeagues,
  listPlayerPoints,
  listTransfers,
} from "@/services/fantasyService";

export function useFantasyDb() {
  const { services, user } = useAuth();
  return { db: services?.db ?? null, uid: user?.uid ?? null };
}

/**
 * Selectable fantasy players, derived from the imported master database.
 * Returns nothing until real players have been imported.
 */
export function usePlayers() {
  const players = useMasterPlayers();
  const teams = useTeams();

  const data = useMemo(
    () => toFantasyPlayers(players.data ?? [], teams.data ?? []),
    [players.data, teams.data],
  );
  const byId = useMemo(() => new Map(data.map((player) => [player.id, player])), [data]);

  return {
    data,
    byId,
    clubs: teams.data ?? [],
    isLoading: players.isLoading || teams.isLoading,
    isError: players.isError,
    totalImported: players.data?.length ?? 0,
  };
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

/** Stored fantasy points. Empty until matches have been scored from real events. */
export function usePlayerPoints(gameweek?: number) {
  const { db } = useFantasyDb();
  return useQuery({
    queryKey: ["fantasy", "playerPoints", gameweek ?? "all"],
    queryFn: () => listPlayerPoints(db!, gameweek),
    enabled: Boolean(db),
    refetchInterval: 120_000,
  });
}

/** Every scheduled gameweek, oldest first. */
export function useGameweeks() {
  const { db } = useFantasyDb();
  return useQuery({
    queryKey: ["fantasy", "gameweeks"],
    queryFn: () => listGameweeks(db!),
    enabled: Boolean(db),
    staleTime: 60_000,
  });
}

/** Re-renders every 15 seconds so deadline locks and countdowns update without a refresh. */
function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * The gameweek a manager can still change right now. Once the current deadline passes this moves
 * on to the next gameweek (`rolledOver`), so edits never touch a gameweek already in play.
 * `target` is null when no gameweeks have been scheduled yet.
 */
export function useEditableGameweek() {
  const query = useGameweeks();
  const { settings } = useFantasySettings();
  const now = useNow();
  const target = useMemo(() => resolveEditTarget(query.data ?? [], now), [query.data, now]);
  const half = seasonHalfFor(target?.gameweek ?? null, settings.secondHalfStart, now);
  return { target, half, now, isLoading: query.isLoading };
}