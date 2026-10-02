/**
 * Season chips: Double Captain and Bench Boost.
 * Each chip can be used twice per season — once in each half — and is switched on per game week.
 */
import type {
  FantasyTeam,
  GameweekChips,
  GameweekLineup,
  SeasonHalf,
} from "@/types/fantasy";

export type ChipKey = keyof GameweekChips;

export const CHIP_KEYS: ChipKey[] = ["doubleCaptain", "benchBoost"];

export const CHIP_LABELS: Record<ChipKey, string> = {
  doubleCaptain: "Double Captain",
  benchBoost: "Bench Boost",
};

/** A normal captain already scores x2; Double Captain doubles that again for the game week. */
export const CAPTAIN_MULTIPLIER = 2;
export const DOUBLE_CAPTAIN_MULTIPLIER = 4;

/** Bench Boost: substitutes who earned 1+ points get this many extra points. */
export const BENCH_BOOST_BONUS = 2;

export const CHIPS_PER_HALF = 1;

export const NO_CHIPS: GameweekChips = { doubleCaptain: false, benchBoost: false };

export function sameChips(a: GameweekChips, b: GameweekChips): boolean {
  return a.doubleCaptain === b.doubleCaptain && a.benchBoost === b.benchBoost;
}

/** Game weeks in which a chip is switched on, excluding `exceptGameweek` (the one being edited). */
function usageFor(
  lineups: FantasyTeam["lineups"],
  chip: ChipKey,
  half: SeasonHalf,
  exceptGameweek?: number,
): number[] {
  return Object.entries(lineups ?? {})
    .filter(([gw, lineup]) => Number(gw) !== exceptGameweek && lineup.chips?.[chip] && lineup.half === half)
    .map(([gw]) => Number(gw));
}

export interface ChipStatus {
  chip: ChipKey;
  /** Whether this chip is on for the game week being edited. */
  active: boolean;
  /** Whether it can be switched on right now. */
  available: boolean;
  /** Why it can't be switched on (null when it can, or when it is already on). */
  reason: string | null;
  /** Game week in this half where the chip was already used, if any. */
  usedInGameweek: number | null;
}

export function chipStatus(
  lineups: FantasyTeam["lineups"],
  chip: ChipKey,
  targetGameweek: number,
  half: SeasonHalf,
  active: boolean,
): ChipStatus {
  const used = usageFor(lineups, chip, half, targetGameweek);
  const usedInGameweek = used.length >= CHIPS_PER_HALF ? (used[0] ?? null) : null;
  const available = usedInGameweek === null;
  return {
    chip,
    active,
    available,
    usedInGameweek,
    reason: available
      ? null
      : `Already used in game week ${usedInGameweek} (${half === 1 ? "first" : "second"} half).`,
  };
}

/** Throws when switching on `chips` for `gameweek` would break the once-per-half rule. */
export function assertChipsAllowed(
  lineups: FantasyTeam["lineups"],
  chips: GameweekChips,
  gameweek: number,
  half: SeasonHalf,
): void {
  for (const chip of CHIP_KEYS) {
    if (!chips[chip]) continue;
    const used = usageFor(lineups, chip, half, gameweek);
    if (used.length >= CHIPS_PER_HALF) {
      throw new Error(
        `${CHIP_LABELS[chip]} was already used in game week ${used[0]} of the ${half === 1 ? "first" : "second"} half.`,
      );
    }
  }
}

/** Remaining uses of a chip across the whole season (max 2: one per half). */
export function chipsRemaining(lineups: FantasyTeam["lineups"], chip: ChipKey): Record<SeasonHalf, boolean> {
  return {
    1: usageFor(lineups, chip, 1).length < CHIPS_PER_HALF,
    2: usageFor(lineups, chip, 2).length < CHIPS_PER_HALF,
  };
}

/**
 * The line-up that applied to a game week: its own entry, otherwise the most recent earlier one,
 * otherwise the team's current base line-up (teams saved before game-week line-ups existed).
 */
export function lineupForGameweek(
  team: Pick<FantasyTeam, "squad" | "starters" | "captainId" | "viceCaptainId" | "lineups">,
  gameweek: number,
): GameweekLineup {
  const entries = Object.entries(team.lineups ?? {})
    .map(([gw, lineup]) => [Number(gw), lineup] as const)
    .filter(([gw]) => gw <= gameweek)
    .sort((a, b) => b[0] - a[0]);
  const found = entries[0];
  if (found) {
    const [gw, lineup] = found;
    // A chip only ever applies to the exact game week it was switched on for.
    return gw === gameweek ? lineup : { ...lineup, chips: NO_CHIPS };
  }
  return {
    squad: team.squad,
    starters: team.starters,
    captainId: team.captainId,
    viceCaptainId: team.viceCaptainId,
    chips: NO_CHIPS,
    half: 1,
  };
}

/** Points a bench player counts for under Bench Boost. Non-players (0 or less) are untouched. */
export function boostedBenchPoints(raw: number): number {
  return raw >= 1 ? raw + BENCH_BOOST_BONUS : raw;
}