import { getPlayer } from "./playerPool";
import type { FantasyTeam, PlayerPoints, PlayerStatLine } from "@/types/fantasy";

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
  points: number;
}

export interface GameweekResult {
  gameweek: number;
  startingPoints: number;
  benchPoints: number;
  captainBonus: number;
  total: number;
  rows: GameweekBreakdownRow[];
}

/** Aggregates a squad's gameweek score: starters count, captain doubles, bench is tracked separately. */
export function calculateGameweek(
  team: Pick<FantasyTeam, "squad" | "starters" | "captainId">,
  points: PlayerPoints[],
  gameweek: number,
): GameweekResult {
  const byPlayer = new Map(
    points.filter((entry) => entry.gameweek === gameweek).map((entry) => [entry.playerId, entry]),
  );

  const rows: GameweekBreakdownRow[] = team.squad.map((playerId) => {
    const raw = byPlayer.get(playerId)?.points ?? 0;
    const starting = team.starters.includes(playerId);
    const captain = team.captainId === playerId && starting;
    return {
      playerId,
      name: getPlayer(playerId)?.name ?? "Unknown player",
      starting,
      captain,
      rawPoints: raw,
      points: starting ? (captain ? raw * 2 : raw) : 0,
    };
  });

  const startingPoints = rows.filter((r) => r.starting).reduce((sum, r) => sum + r.rawPoints, 0);
  const benchPoints = rows.filter((r) => !r.starting).reduce((sum, r) => sum + r.rawPoints, 0);
  const captainBonus = rows.find((r) => r.captain)?.rawPoints ?? 0;

  return {
    gameweek,
    startingPoints,
    benchPoints,
    captainBonus,
    total: startingPoints + captainBonus,
    rows,
  };
}

/** Overall points across every stored gameweek. */
export function calculateOverall(
  team: Pick<FantasyTeam, "squad" | "starters" | "captainId">,
  points: PlayerPoints[],
): number {
  const gameweeks = [...new Set(points.map((entry) => entry.gameweek))];
  return gameweeks.reduce((sum, gw) => sum + calculateGameweek(team, points, gw).total, 0);
}
