/**
 * Maps raw SportScore responses onto the application's internal models.
 * Nothing outside this file should read raw provider field names.
 *
 * Rule: never invent a value. A field the provider does not supply stays null.
 */
import { SPORTS_API } from "@/config/sportsApi";
import type {
  RawIncident,
  RawLineupPlayer,
  RawMatch,
  RawMatchDetail,
  RawScorer,
  RawStandingsResponse,
} from "./types";

/* --------------------------------- teams --------------------------------- */

export interface NormalizedTeam {
  /** SportScore slug — the external identifier, not the app's master team id. */
  slug: string;
  name: string;
  shortName: string;
  logo: string | null;
}

/** "Mamelodi Sundowns" -> "MAM". Display only; never used as a key. */
export function abbreviate(name: string): string {
  const words = name.replace(/\bFC\b/gi, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "—";
  if (words.length === 1) return words[0]!.slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0]!)
    .join("")
    .toUpperCase();
}

/** Loose key used to line up provider names with master-data names. */
export function nameKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|afc|football club|city|united)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

export function slugFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

/* ------------------------------- standings -------------------------------- */

export interface NormalizedStandingRow {
  position: number;
  team: NormalizedTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function normalizeStandings(raw: RawStandingsResponse): NormalizedStandingRow[] {
  const rows = (raw.tables ?? []).flatMap((table) => table.rows ?? []);
  return rows
    .filter((row) => Boolean(row.team))
    .map((row, index) => ({
      position: row.pos ?? index + 1,
      team: {
        slug: row.team_slug ?? slugFromUrl(row.team_url) ?? nameKey(row.team ?? ""),
        name: row.team ?? "Unknown team",
        shortName: abbreviate(row.team ?? ""),
        logo: row.team_logo || null,
      },
      played: row.p ?? 0,
      won: row.w ?? 0,
      drawn: row.d ?? 0,
      lost: row.l ?? 0,
      goalsFor: row.gf ?? 0,
      goalsAgainst: row.ga ?? 0,
      goalDifference: row.gd ?? (row.gf ?? 0) - (row.ga ?? 0),
      points: row.pts ?? 0,
    }))
    .sort((a, b) => a.position - b.position);
}

/* --------------------------------- matches -------------------------------- */

export type NormalizedMatchStatus = "live" | "finished" | "upcoming" | "postponed";

export interface NormalizedMatch {
  /** Stable composite key: slug + kickoff. A slug alone can repeat across seasons. */
  id: string;
  matchSlug: string;
  competition: string;
  competitionLogo: string | null;
  status: NormalizedMatchStatus;
  statusText: string;
  startTime: string | null;
  minute: number | null;
  home: NormalizedTeam;
  away: NormalizedTeam;
  homeScore: number | null;
  awayScore: number | null;
}

function toScore(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStatus(raw: RawMatch): NormalizedMatchStatus {
  const status = (raw.status ?? "").toLowerCase();
  const text = (raw.status_text ?? "").toLowerCase();
  if (status === "finished" || text === "finished" || text === "full time") return "finished";
  if (status === "upcoming" || text === "not started") return "upcoming";
  if (status.includes("postpon") || status.includes("cancel") || text.includes("postpon")) {
    return "postponed";
  }
  return "live";
}

export function normalizeMatch(
  raw: RawMatch,
  teamBySlug?: Map<string, NormalizedTeam>,
): NormalizedMatch | null {
  const matchSlug = slugFromUrl(raw.url);
  if (!matchSlug || !raw.home || !raw.away) return null;

  const resolve = (name: string, logo: string | null | undefined): NormalizedTeam => {
    const known = teamBySlug ? [...teamBySlug.values()].find((t) => nameKey(t.name) === nameKey(name)) : undefined;
    if (known) return known;
    return { slug: nameKey(name), name, shortName: abbreviate(name), logo: logo || null };
  };

  return {
    // The provider reuses a fixture slug across seasons, so the kickoff is part of the key.
    id: `${matchSlug}@${raw.time ?? "unknown"}`,
    matchSlug,
    competition: raw.competition ?? "",
    competitionLogo: raw.competition_logo || null,
    status: toStatus(raw),
    statusText: raw.status_text ?? "",
    startTime: raw.time ?? null,
    minute: typeof raw.live_minute === "number" ? raw.live_minute : null,
    home: resolve(raw.home, raw.home_logo),
    away: resolve(raw.away, raw.away_logo),
    homeScore: toScore(raw.home_score),
    awayScore: toScore(raw.away_score),
  };
}

export function normalizeMatches(
  list: RawMatch[] | undefined,
  teamBySlug?: Map<string, NormalizedTeam>,
): NormalizedMatch[] {
  return (list ?? [])
    .map((raw) => normalizeMatch(raw, teamBySlug))
    .filter((match): match is NormalizedMatch => match !== null);
}

/** Keeps only matches belonging to the configured competition. */
export function onlyCompetition(matches: NormalizedMatch[]): NormalizedMatch[] {
  const key = nameKey(SPORTS_API.competitionName);
  return matches.filter((match) => nameKey(match.competition) === key);
}

/** De-duplicates matches gathered from several club endpoints. */
export function dedupeMatches(matches: NormalizedMatch[]): NormalizedMatch[] {
  const byId = new Map<string, NormalizedMatch>();
  for (const match of matches) byId.set(match.id, match);
  return [...byId.values()];
}

/* -------------------------------- incidents ------------------------------- */

export type NormalizedEventType =
  | "goal"
  | "own-goal"
  | "yellow"
  | "red"
  | "substitution"
  | "penalty"
  | "other";

export interface NormalizedMatchEvent {
  id: string;
  matchId: string;
  minute: number | null;
  type: NormalizedEventType;
  /** Exactly as the provider spells it — no player id is supplied. */
  playerName: string | null;
  playerInName: string | null;
  playerOutName: string | null;
  side: "home" | "away" | null;
  homeScore: number | null;
  awayScore: number | null;
  rawType: string;
}

function toEventType(raw: RawIncident): NormalizedEventType {
  const label = (raw.type ?? "").toLowerCase();
  if (label.includes("own goal")) return "own-goal";
  if (label.includes("penalty")) return "penalty";
  if (raw.is_goal || label === "goal") return "goal";
  if (label.includes("yellow")) return "yellow";
  if (label.includes("red")) return "red";
  if (raw.is_sub || label.includes("substitution")) return "substitution";
  return "other";
}

export function normalizeIncidents(
  matchId: string,
  incidents: RawIncident[] | undefined,
): NormalizedMatchEvent[] {
  return (incidents ?? []).map((raw, index) => ({
    id: `${matchId}-${index}`,
    matchId,
    minute: typeof raw.time === "number" ? raw.time : null,
    type: toEventType(raw),
    playerName: raw.player?.trim() ? raw.player.trim() : null,
    playerInName: raw.player_in?.trim() ? raw.player_in.trim() : null,
    playerOutName: raw.player_out?.trim() ? raw.player_out.trim() : null,
    side: raw.side === "home" || raw.side === "away" ? raw.side : null,
    homeScore: typeof raw.home_score === "number" ? raw.home_score : null,
    awayScore: typeof raw.away_score === "number" ? raw.away_score : null,
    rawType: raw.type ?? "",
  }));
}

/* --------------------------------- lineups -------------------------------- */

export interface NormalizedLineupPlayer {
  name: string;
  shirtNumber: number | null;
  /** Provider position letter (G/D/M/F) mapped to the app's positions, else null. */
  position: "GK" | "DEF" | "MID" | "FWD" | null;
  captain: boolean;
  started: boolean;
}

export interface NormalizedLineups {
  confirmed: boolean;
  homeFormation: string | null;
  awayFormation: string | null;
  home: NormalizedLineupPlayer[];
  away: NormalizedLineupPlayer[];
}

const POSITION_MAP: Record<string, "GK" | "DEF" | "MID" | "FWD"> = {
  G: "GK",
  D: "DEF",
  M: "MID",
  F: "FWD",
};

function toLineupPlayer(raw: RawLineupPlayer, started: boolean): NormalizedLineupPlayer | null {
  const name = raw.name?.trim();
  if (!name) return null;
  const letter = (raw.position ?? "").trim().toUpperCase();
  return {
    name,
    shirtNumber: typeof raw.number === "number" ? raw.number : null,
    position: POSITION_MAP[letter] ?? null,
    captain: Boolean(raw.captain),
    started,
  };
}

export function normalizeLineups(detail: RawMatchDetail): NormalizedLineups | null {
  const lineups = detail.lineups;
  if (!lineups) return null;
  const build = (xi?: RawLineupPlayer[], subs?: RawLineupPlayer[]) =>
    [
      ...(xi ?? []).map((p) => toLineupPlayer(p, true)),
      ...(subs ?? []).map((p) => toLineupPlayer(p, false)),
    ].filter((p): p is NormalizedLineupPlayer => p !== null);

  const home = build(lineups.home_xi, lineups.home_subs);
  const away = build(lineups.away_xi, lineups.away_subs);
  if (home.length === 0 && away.length === 0) return null;

  return {
    confirmed: Boolean(lineups.confirmed),
    homeFormation: lineups.home_formation || null,
    awayFormation: lineups.away_formation || null,
    home,
    away,
  };
}

export interface NormalizedMatchDetail {
  match: NormalizedMatch;
  events: NormalizedMatchEvent[];
  lineups: NormalizedLineups | null;
  trackerId: string | null;
}

export function normalizeMatchDetail(
  detail: RawMatchDetail | null | undefined,
): NormalizedMatchDetail | null {
  if (!detail) return null;
  const match = normalizeMatch(detail);
  if (!match) return null;
  return {
    match,
    events: normalizeIncidents(match.id, detail.incidents),
    lineups: normalizeLineups(detail),
    trackerId: detail.tracker?.id ?? null,
  };
}

/* ------------------------------- top scorers ------------------------------ */

export interface NormalizedScorer {
  rank: number;
  /** Null when the provider gives no usable identifier — such rows are dropped. */
  playerSlug: string;
  playerName: string;
  photo: string | null;
  teamName: string;
  teamSlug: string | null;
  teamLogo: string | null;
  goals: number | null;
  assists: number | null;
  appearances: number | null;
  minutes: number | null;
  /** Provider rating. This is NOT fantasy points. */
  rating: number | null;
}

const INVALID_NAMES = new Set(["", "unknown", "unknown player", "n/a", "-"]);

export function normalizeScorers(list: RawScorer[] | undefined): NormalizedScorer[] {
  return (list ?? [])
    .map((raw, index): NormalizedScorer | null => {
      const slug = raw.player_slug ?? slugFromUrl(raw.player_url);
      const name = raw.player?.trim() ?? "";
      // Never build a permanent record from a row with no identifier or no real name.
      if (!slug || INVALID_NAMES.has(name.toLowerCase())) return null;
      return {
        rank: raw.rank ?? index + 1,
        playerSlug: slug,
        playerName: name,
        photo: raw.player_logo || null,
        teamName: raw.team ?? "",
        teamSlug: raw.team_slug ?? null,
        teamLogo: raw.team_logo || null,
        goals: typeof raw.goals === "number" ? raw.goals : null,
        assists: typeof raw.assists === "number" ? raw.assists : null,
        appearances: typeof raw.matches === "number" ? raw.matches : null,
        minutes: typeof raw.minutes === "number" ? raw.minutes : null,
        rating: typeof raw.rating === "number" ? raw.rating : null,
      };
    })
    .filter((row): row is NormalizedScorer => row !== null);
}
