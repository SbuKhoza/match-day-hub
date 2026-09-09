/**
 * Single source of truth for the external football data provider (SportScore).
 * Never hardcode provider URLs anywhere else — build them from here.
 */
export const SPORTS_API = {
  baseUrl: "https://sportscore.com",
  sport: "football",
  competitionSlug: "south-africa-premier-soccer-league",
  competitionName: "South Africa Premier Soccer League",
  attributionUrl: "https://sportscore.com/",
} as const;

/**
 * Cache lifetimes in ms. The provider caches responses for ~60s and allows
 * ~10k requests per IP per day, so nothing below refreshes faster than that.
 */
export const CACHE_TTL = {
  /** Global match list — used for live match discovery. */
  matches: 60_000,
  /** A single match (score, lineups, incidents) while it is in progress. */
  liveMatch: 60_000,
  /** A completed match never changes again. */
  finishedMatch: 24 * 60 * 60_000,
  /** Fixtures & results for one club. */
  teamFixtures: 5 * 60_000,
  standings: 90_000,
  topScorers: 10 * 60_000,
  player: 10 * 60_000,
  tracker: 60_000,
  bracket: 30 * 60_000,
} as const;

/** Statistics the fantasy engine needs that SportScore does not expose. */
export const UNAVAILABLE_STATS = [
  "assists per match",
  "own goals",
  "penalty misses",
  "penalty saves",
  "minutes played per player",
] as const;
