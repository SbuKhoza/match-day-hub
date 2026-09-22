/**
 * Centralized SportScore REST client.
 *
 * Every SportScore request in the application goes through this module —
 * components never call fetch() directly. All responses are cached and
 * de-duplicated (see ./cache).
 */
import { CACHE_TTL, SPORTS_API } from "@/config/sportsApi";
import { cachedGet, type CachedResult } from "./cache";
import type {
  RawMatchResponse,
  RawMatchesResponse,
  RawPlayerResponse,
  RawStandingsResponse,
  RawTeamResponse,
  RawTopScorersResponse,
} from "./types";

function endpoint(path: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(`/api/widget/${path}/`, SPORTS_API.baseUrl);
  url.searchParams.set("sport", SPORTS_API.sport);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** A. Recent / live / upcoming matches across all competitions. */
export function getMatches(limit = 50): Promise<CachedResult<RawMatchesResponse>> {
  return cachedGet<RawMatchesResponse>(endpoint("matches", { limit }), CACHE_TTL.matches);
}

/**
 * B. Full detail for one match: score, status, lineups, incidents.
 * Finished matches are cached hard because they never change again.
 */
export function getMatch(
  matchSlug: string,
  options: { finished?: boolean } = {},
): Promise<CachedResult<RawMatchResponse>> {
  return cachedGet<RawMatchResponse>(
    endpoint("match", { slug: matchSlug }),
    options.finished ? CACHE_TTL.finishedMatch : CACHE_TTL.liveMatch,
  );
}

/** C. Fixtures and results for one club. */
export function getTeamFixtures(
  teamSlug: string,
  limit = 30,
): Promise<CachedResult<RawTeamResponse>> {
  return cachedGet<RawTeamResponse>(
    endpoint("team", { slug: teamSlug, limit }),
    CACHE_TTL.teamFixtures,
  );
}

/** D. League table for the configured competition. */
export function getStandings(): Promise<CachedResult<RawStandingsResponse>> {
  return cachedGet<RawStandingsResponse>(
    endpoint("standings", { slug: SPORTS_API.competitionSlug }),
    CACHE_TTL.standings,
  );
}

/** E. Season top scorers. */
export function getTopScorers(limit = 50): Promise<CachedResult<RawTopScorersResponse>> {
  return cachedGet<RawTopScorersResponse>(
    endpoint("topscorers", { slug: SPORTS_API.competitionSlug, limit, stat: "goals" }),
    CACHE_TTL.topScorers,
  );
}

/** E. Season top assist providers. */
export function getTopAssists(limit = 50): Promise<CachedResult<RawTopScorersResponse>> {
  return cachedGet<RawTopScorersResponse>(
    endpoint("topscorers", { slug: SPORTS_API.competitionSlug, limit, stat: "assists" }),
    CACHE_TTL.topScorers,
  );
}

/** F. Player profile. `stats` may legitimately be null. */
export function getPlayer(playerSlug: string): Promise<CachedResult<RawPlayerResponse>> {
  return cachedGet<RawPlayerResponse>(endpoint("player", { slug: playerSlug }), CACHE_TTL.player);
}

/** G. Optional live tracker — only request it when a screen is actually showing it. */
export function getMatchTracker(matchId: string): Promise<CachedResult<unknown>> {
  return cachedGet<unknown>(endpoint("tracker", { id: matchId }), CACHE_TTL.tracker);
}

/** H. Optional competition bracket (cup-style competitions). */
export function getCompetitionBracket(): Promise<CachedResult<unknown>> {
  return cachedGet<unknown>(
    endpoint("bracket", { slug: SPORTS_API.competitionSlug }),
    CACHE_TTL.bracket,
  );
}
