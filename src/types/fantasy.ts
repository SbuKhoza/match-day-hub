export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";

/** Selection view of an imported player, priced by this application. */
export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  clubId: string;
  clubName: string;
  clubShort: string | null;
  price: number;
  totalPoints: number;
  form: number;
}

/** Which half of the season a game week belongs to (set by the admin's second-half start date). */
export type SeasonHalf = 1 | 2;

/** Chips a manager can switch on for a single game week. Each can be used once per half. */
export interface GameweekChips {
  doubleCaptain: boolean;
  benchBoost: boolean;
}

/**
 * The team a manager fielded for one game week. Stored on the fantasy team under `lineups`, keyed
 * by game week number, so a change made after a deadline only affects the next game week.
 */
export interface GameweekLineup {
  squad: string[];
  starters: string[];
  captainId: string | null;
  viceCaptainId: string | null;
  chips: GameweekChips;
  /** Season half this game week falls in; chips are limited to one use per half. */
  half: SeasonHalf;
}

export interface FantasyTeam {
  uid: string;
  name: string;
  squad: string[];
  starters: string[];
  captainId: string | null;
  viceCaptainId: string | null;
  budgetSpent: number;
  gameweek: number;
  totalPoints: number;
  updatedAt: string;
  /** Per-game-week line-ups, keyed by game week number. Missing on teams saved before chips. */
  lineups?: Record<string, GameweekLineup>;
  /** Points deducted for extra transfers, keyed by game week number. Applied when that game week is scored. */
  transferPenalties?: Record<string, number>;
  /** Season this team was built for, e.g. "2026/27". Missing on teams saved before seasons were tracked. */
  season?: string;
}

export interface League {
  id: string;
  name: string;
  code: string;
  ownerUid: string;
  memberUids: string[];
  createdAt: string;
}

export interface Gameweek {
  id: string;
  number: number;
  status: "upcoming" | "live" | "finished";
  /** Stored deadline. When `firstKickoff` is set the deadline is derived from it instead. */
  deadline: string;
  /** Kick-off of the first match of the game week (ISO). The deadline is one hour before it. */
  firstKickoff?: string | null;
}

export interface Transfer {
  id: string;
  uid: string;
  gameweek: number;
  outPlayerId: string;
  inPlayerId: string;
  createdAt: string;
  /** Season the transfer was made in. Missing on older records. */
  season?: string;
}

export interface PlayerStatLine {
  appeared: boolean;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  penaltySaves: number;
  penaltyMisses: number;
  yellowCards: number;
  redCards: number;
}

export interface PlayerPoints {
  id: string;
  playerId: string;
  gameweek: number;
  stats: PlayerStatLine;
  points: number;
}

export const SQUAD_RULES = {
  budget: 220_000_000,
  maxPerClub: 3,
  starters: 11,
  positions: { GK: 2, DEF: 6, MID: 6, FWD: 3 } as Record<PlayerPosition, number>,
} as const;

export const SQUAD_SIZE = 17;