import type { FantasyTeam, GameweekChips, PlayerPoints, PlayerStatLine } from "@/types/fantasy";
import {
  CAPTAIN_MULTIPLIER,
  DOUBLE_CAPTAIN_MULTIPLIER,
  boostedBenchPoints,
  lineupForGameweek,
} from "./chipService";

/** Resolves a player id to a display name; supplied by the caller from imported data. */
export type NameResolver = (playerId: string) => string | undefined;

export const SCORING_RULES = [
  { key: "appearance", label: "Appearance", points: 1 },
  { key: "goal", label: "Goal", points: 4 },
  { key: "assist", label: "Assist", points: 2 },
  { key: "cleanSheet", label: "Clean sheet", points: 4 },
  { key: "penaltySave", label: "Penalty save", points: 2 },
  { key: "penaltyMiss", label: "Penalty miss", points: -1 },
  { key: "yellowCard", label: "Yellow card", points: -1 },
  { key: "redCard", label: "Red card", points: -2 },
] as const;

export const emptyStatLine = (): PlayerStatLine => ({
  appeared: false,
  goals: 0,
  assists: 0,
  cleanSheet: false,
  penaltySaves: 0,
  penaltyMisses: 0,
  yellowCards: 0,
  redCards: 0,
});

/** Pure scoring rule: stat line -> fantasy points for one player in one gameweek. */
export function scoreStatLine(stats: PlayerStatLine): number {
  if (!stats.appeared) return 0;
  return (
    1 +
    stats.goals * 4 +
    stats.assists * 2 +
    (stats.cleanSheet ? 4 : 0) +
    stats.penaltySaves * 2 -
    stats.penaltyMisses -
    stats.yellowCards -
    stats.redCards * 2
  );
}

export interface GameweekBreakdownRow {
  playerId: string;
  name: string;
  starting: boolean;
  captain: boolean;
  rawPoints: number;
  /** Points that count towards the total (bench players count only under Bench Boost). */
  points: number;
}

export interface GameweekResult {
  gameweek: number;
  startingPoints: number;
  /** Points the substitutes earned, before any Bench Boost bonus. */
  benchPoints: number;
  /** Extra points from the captain armband (and Double Captain) on top of the captain's own score. */
  captainBonus: number;
  /** Extra points Bench Boost added to substitutes who scored 1+. */
  benchBoostBonus: number;
  /** Bench points that count towards the total (0 unless Bench Boost is on). */
  benchCounted: number;
  chips: GameweekChips;
  total: number;
  rows: GameweekBreakdownRow[];
}

type ScoringTeam = Pick<
  FantasyTeam,
  "squad" | "starters" | "captainId" | "viceCaptainId" | "lineups"
>;

/**
 * Aggregates a squad's gameweek score using the line-up that applied to that game week. Starters
 * count and the captain is doubled (x4 with Double Captain). Substitutes count only under Bench
 * Boost, where anyone who scored 1+ gets 2 extra points and anyone who didn't play stays at 0.
 */
export function calculateGameweek(
  team: Omit<ScoringTeam, "viceCaptainId"> & { viceCaptainId?: string | null },
  points: PlayerPoints[],
  gameweek: number,
  resolveName?: NameResolver,
): GameweekResult {
  const lineup = lineupForGameweek({ viceCaptainId: null, ...team }, gameweek);
  const { chips } = lineup;
  const captainMultiplier = chips.doubleCaptain ? DOUBLE_CAPTAIN_MULTIPLIER : CAPTAIN_MULTIPLIER;

  const byPlayer = new Map(
    points.filter((entry) => entry.gameweek === gameweek).map((entry) => [entry.playerId, entry]),
  );

  const rows: GameweekBreakdownRow[] = lineup.squad.map((playerId) => {
    const raw = byPlayer.get(playerId)?.points ?? 0;
    const starting = lineup.starters.includes(playerId);
    const captain = lineup.captainId === playerId && starting;
    let counted = 0;
    if (starting) counted = captain ? raw * captainMultiplier : raw;
    else if (chips.benchBoost) counted = boostedBenchPoints(raw);
    return { playerId, name: resolveName?.(playerId) ?? playerId, starting, captain, rawPoints: raw, points: counted };
  });

  const startingPoints = rows.filter((r) => r.starting).reduce((sum, r) => sum + r.rawPoints, 0);
  const bench = rows.filter((r) => !r.starting);
  const benchPoints = bench.reduce((sum, r) => sum + r.rawPoints, 0);
  const benchCounted = bench.reduce((sum, r) => sum + r.points, 0);
  const captainRaw = rows.find((r) => r.captain)?.rawPoints ?? 0;
  const captainBonus = captainRaw * (captainMultiplier - 1);

  return {
    gameweek,
    startingPoints,
    benchPoints,
    captainBonus,
    benchBoostBonus: benchCounted - (chips.benchBoost ? benchPoints : 0),
    benchCounted,
    chips,
    total: startingPoints + captainBonus + benchCounted,
    rows,
  };
}

/** Overall points across every stored gameweek. */
export function calculateOverall(
  team: Omit<ScoringTeam, "viceCaptainId"> & { viceCaptainId?: string | null },
  points: PlayerPoints[],
): number {
  const gameweeks = [...new Set(points.map((entry) => entry.gameweek))];
  return gameweeks.reduce((sum, gw) => sum + calculateGameweek(team, points, gw).total, 0);
}