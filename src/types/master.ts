import type { PlayerPosition } from "./fantasy";

export type { PlayerPosition };

export const CURRENT_SEASON = "2026/27";

export type PlayerStatus = "active" | "injured" | "suspended" | "transferred" | "inactive";

/** Master club record. Imported from the WorldFootball export, never generated. */
export interface MasterTeam {
  /** Stable identifier from the import file. Never the display name. */
  teamId: string;
  teamName: string;
  shortName: string | null;
  country: string | null;
  stadium: string | null;
  logo: string | null;
  worldfootballUrl: string | null;
  /** Links this club to the football data provider. */
  sportscoreSlug: string | null;
  season: string;
  active: boolean;
  source: string;
  scrapedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Master player record. Identity is stable across club transfers. */
export interface MasterPlayer {
  playerId: string;
  playerName: string;
  playerNameNormalized: string;
  teamId: string;
  teamName: string;
  /** Normalized position, or null when the source did not supply a usable one. */
  position: PlayerPosition | null;
  positionRaw: string | null;
  shirtNumber: number | null;
  nationality: string | null;
  dateOfBirth: string | null;
  worldfootballUrl: string | null;
  /** Provider mapping — left empty until a reliable match exists. */
  sportscorePlayerId: string | null;
  sportscoreSlug: string | null;
  sportscoreName: string | null;
  season: string;
  active: boolean;
  status: PlayerStatus;
  /** Set by this application, never by the data provider. */
  fantasyPrice: number | null;
  /** Calculated by this application's scoring engine. */
  fantasyPoints: number;
  source: string;
  scrapedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerTransferRecord {
  transferId: string;
  playerId: string;
  playerName: string;
  fromTeamId: string;
  fromTeamName: string;
  toTeamId: string;
  toTeamName: string;
  transferDate: string;
  season: string;
  source: string;
  createdAt: string;
}

export type ImportType = "teams" | "players" | "transfers";

export interface DataImportRecord {
  importId: string;
  type: ImportType;
  fileName: string;
  season: string;
  source: string;
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  warnings: number;
  errors: number;
  importedBy: string;
  importedAt: string;
}

/** Stored match record sourced from the football data provider. */
export interface StoredMatch {
  matchId: string;
  sportscoreMatchId: string | null;
  competition: string;
  season: string;
  homeTeamId: string | null;
  homeTeamName: string;
  awayTeamId: string | null;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  startTime: string | null;
  sportscoreSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMatchEvent {
  eventId: string;
  matchId: string;
  playerId: string | null;
  playerName: string | null;
  teamId: string | null;
  teamName: string | null;
  eventType: string;
  minute: number | null;
  extraTime: number | null;
  relatedPlayerId: string | null;
  relatedPlayerName: string | null;
  rawData: unknown;
  createdAt: string;
}

export interface PlayerMatchStats {
  matchId: string;
  playerId: string;
  teamId: string | null;
  playerName: string;
  minutes: number | null;
  started: boolean | null;
  goals: number;
  assists: number | null;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  substitutedIn: number | null;
  substitutedOut: number | null;
  rating: number | null;
  rawData: unknown;
  updatedAt: string;
}

/** Loose key for comparing names across sources. */
export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
