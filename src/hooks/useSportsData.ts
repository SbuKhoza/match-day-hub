import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { SPORTS_API } from "@/config/sportsApi";
import {
  getMatch,
  getMatches,
  getStandings,
  getTeamFixtures,
  getTopAssists,
  getTopScorers,
  getPlayer as getProviderPlayer,
} from "@/services/sportscore/sportscoreApi";
import {
  dedupeMatches,
  normalizeMatchDetail,
  normalizeMatches,
  normalizeScorers,
  normalizeStandings,
  onlyCompetition,
  type NormalizedMatch,
  type NormalizedStandingRow,
  type NormalizedTeam,
} from "@/services/sportscore/normalize";

/** Refresh cadences chosen to respect the provider's request limit. */
const REFETCH = {
  standings: 120_000,
  liveMatches: 60_000,
  fixtures: 10 * 60_000,
  scorers: 15 * 60_000,
} as const;

export interface LiveDataMeta {
  fetchedAt: number | null;
  stale: boolean;
  error: string | null;
}

export function useStandings() {
  const query = useQuery({
    queryKey: ["sportscore", "standings"],
    queryFn: async () => {
      const result = await getStandings();
      return { rows: normalizeStandings(result.data), meta: result };
    },
    refetchInterval: REFETCH.standings,
    staleTime: 90_000,
  });

  const rows: NormalizedStandingRow[] = query.data?.rows ?? [];
  const meta: LiveDataMeta = {
    fetchedAt: query.data?.meta.fetchedAt ?? null,
    stale: query.data?.meta.stale ?? false,
    error: query.data?.meta.error ?? (query.error instanceof Error ? query.error.message : null),
  };
  return { ...query, rows, meta };
}

/** Clubs as the data provider knows them, derived from the league table. */
export function useProviderTeams() {
  const { rows, isLoading, meta } = useStandings();
  const teams = useMemo(() => rows.map((row) => row.team), [rows]);
  const bySlug = useMemo(
    () => new Map<string, NormalizedTeam>(teams.map((team) => [team.slug, team])),
    [teams],
  );
  return { teams, bySlug, isLoading, meta };
}

/** Live and very recent matches, filtered to the configured competition. */
export function useLiveMatches() {
  const { bySlug } = useProviderTeams();
  const query = useQuery({
    queryKey: ["sportscore", "matches"],
    queryFn: async () => {
      const result = await getMatches(50);
      return { raw: result.data.matches ?? [], meta: result };
    },
    refetchInterval: REFETCH.liveMatches,
    staleTime: 60_000,
  });

  const matches = useMemo(
    () => onlyCompetition(normalizeMatches(query.data?.raw, bySlug)),
    [query.data?.raw, bySlug],
  );
  const meta: LiveDataMeta = {
    fetchedAt: query.data?.meta.fetchedAt ?? null,
    stale: query.data?.meta.stale ?? false,
    error: query.data?.meta.error ?? (query.error instanceof Error ? query.error.message : null),
  };
  return { ...query, matches, meta };
}

/** Every fixture and result for one club. */
export function useTeamMatches(teamSlug: string | null | undefined) {
  const { bySlug } = useProviderTeams();
  const query = useQuery({
    queryKey: ["sportscore", "teamMatches", teamSlug],
    queryFn: async () => {
      const result = await getTeamFixtures(teamSlug!, 30);
      return { raw: result.data.matches ?? [], meta: result };
    },
    enabled: Boolean(teamSlug),
    staleTime: REFETCH.fixtures,
  });

  const matches = useMemo(
    () => normalizeMatches(query.data?.raw, bySlug),
    [query.data?.raw, bySlug],
  );
  const meta: LiveDataMeta = {
    fetchedAt: query.data?.meta.fetchedAt ?? null,
    stale: query.data?.meta.stale ?? false,
    error: query.data?.meta.error ?? (query.error instanceof Error ? query.error.message : null),
  };
  return { ...query, matches, meta };
}

/**
 * League-wide fixtures and results, gathered club by club.
 * Only runs when a screen actually needs it, and each club is cached for minutes.
 */
export function useLeagueMatches(enabled = true) {
  const { teams, bySlug, isLoading: teamsLoading } = useProviderTeams();
  const results = useQueries({
    queries: teams.map((team) => ({
      queryKey: ["sportscore", "teamMatches", team.slug],
      queryFn: async () => {
        const result = await getTeamFixtures(team.slug, 30);
        return { raw: result.data.matches ?? [], meta: result };
      },
      enabled: enabled && teams.length > 0,
      staleTime: REFETCH.fixtures,
    })),
  });

  const matches = useMemo(() => {
    const all = results.flatMap((result) => normalizeMatches(result.data?.raw, bySlug));
    return dedupeMatches(onlyCompetition(all));
  }, [results, bySlug]);

  const fetchedAt = results.reduce<number | null>((latest, result) => {
    const at = result.data?.meta.fetchedAt ?? null;
    return at && (!latest || at > latest) ? at : latest;
  }, null);

  return {
    matches,
    isLoading: teamsLoading || results.some((result) => result.isLoading),
    isError: results.length > 0 && results.every((result) => result.isError),
    meta: {
      fetchedAt,
      stale: results.some((result) => result.data?.meta.stale === true),
      error: results.find((result) => result.error)?.error instanceof Error
        ? (results.find((result) => result.error)!.error as Error).message
        : null,
    } satisfies LiveDataMeta,
  };
}

/** Full detail for one fixture: score, line-ups and incidents. */
export function useMatchDetail(match: NormalizedMatch | null) {
  const query = useQuery({
    queryKey: ["sportscore", "match", match?.matchSlug, match?.startTime],
    queryFn: async () => {
      const result = await getMatch(match!.matchSlug, { finished: match!.status === "finished" });
      return { detail: normalizeMatchDetail(result.data.match), meta: result };
    },
    enabled: Boolean(match),
    refetchInterval: match?.status === "live" ? REFETCH.liveMatches : false,
    staleTime: match?.status === "finished" ? Infinity : 60_000,
  });

  return {
    ...query,
    detail: query.data?.detail ?? null,
    meta: {
      fetchedAt: query.data?.meta.fetchedAt ?? null,
      stale: query.data?.meta.stale ?? false,
      error: query.data?.meta.error ?? null,
    } satisfies LiveDataMeta,
  };
}

export function useTopScorers(stat: "goals" | "assists" = "goals") {
  const query = useQuery({
    queryKey: ["sportscore", "topscorers", stat],
    queryFn: async () => {
      const result = stat === "goals" ? await getTopScorers(50) : await getTopAssists(50);
      return { rows: normalizeScorers(result.data.scorers), meta: result };
    },
    staleTime: REFETCH.scorers,
  });

  return {
    ...query,
    rows: query.data?.rows ?? [],
    meta: {
      fetchedAt: query.data?.meta.fetchedAt ?? null,
      stale: query.data?.meta.stale ?? false,
      error: query.data?.meta.error ?? (query.error instanceof Error ? query.error.message : null),
    } satisfies LiveDataMeta,
  };
}

/** Provider profile for a player. `stats` being null does not mean "unknown player". */
export function useProviderPlayer(slug: string | null | undefined) {
  const query = useQuery({
    queryKey: ["sportscore", "player", slug],
    queryFn: async () => {
      const result = await getProviderPlayer(slug!);
      return result.data;
    },
    enabled: Boolean(slug),
    staleTime: 10 * 60_000,
  });
  return {
    ...query,
    profile: query.data?.player ?? null,
    stats: query.data?.stats ?? null,
  };
}

export const COMPETITION_NAME = SPORTS_API.competitionName;
