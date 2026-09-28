import type { FantasyTeam, Gameweek, Player, PlayerPosition } from "@/types/fantasy";

/**
 * Rules for the XI (11 players in total): exactly one goalkeeper and at least three defenders.
 * Midfielders and forwards are unrestricted, so the formation is whatever the user lines up.
 */
export const FORMATION_LIMITS: Record<PlayerPosition, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 10 },
  MID: { min: 0, max: 10 },
  FWD: { min: 0, max: 10 },
};

export const POSITION_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];

export interface Lineup {
  starters: string[];
  captainId: string | null;
  viceCaptainId: string | null;
}

export function lineupFromTeam(team: FantasyTeam): Lineup {
  return {
    starters: [...team.starters],
    captainId: team.captainId,
    viceCaptainId: team.viceCaptainId,
  };
}

/** Bench = squad members that are not starting, goalkeeper first, then DEF/MID/FWD. */
export function benchOf(squad: Player[], starters: string[]): Player[] {
  return squad
    .filter((player) => !starters.includes(player.id))
    .sort((a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position));
}

export function isFormationValid(starters: Player[]): boolean {
  if (starters.length !== 11) return false;
  return POSITION_ORDER.every((position) => {
    const count = starters.filter((player) => player.position === position).length;
    const { min, max } = FORMATION_LIMITS[position];
    return count >= min && count <= max;
  });
}

/**
 * Can `benchPlayer` replace `starter`? Both must already be in the squad. A goalkeeper can only
 * be swapped with a goalkeeper; any outfield player can be swapped with any other outfield
 * player as long as at least three defenders remain in the XI.
 */
export function canSubstitute(
  starter: Player,
  benchPlayer: Player,
  squad: Player[],
  starters: string[],
): boolean {
  const inSquad = (p: Player) => squad.some((member) => member.id === p.id);
  if (!inSquad(starter) || !inSquad(benchPlayer)) return false;
  if (!starters.includes(starter.id) || starters.includes(benchPlayer.id)) return false;
  if (starter.position === benchPlayer.position) return true;

  const next = squad.filter((p) => (p.id === starter.id ? false : starters.includes(p.id)));
  return isFormationValid([...next, benchPlayer]);
}

/** Human-readable reason a starter/sub pair can't be swapped (null when the swap is fine). */
export function swapBlockedReason(
  starter: Player,
  benchPlayer: Player,
  squad: Player[],
  starters: string[],
): string | null {
  if (canSubstitute(starter, benchPlayer, squad, starters)) return null;
  if ((starter.position === "GK") !== (benchPlayer.position === "GK")) {
    return "A goalkeeper can only be swapped with another goalkeeper.";
  }
  return "That swap would leave fewer than 3 defenders in your line-up.";
}

/**
 * Repairs an XI that breaks the rules (e.g. a team saved with 2 goalkeepers): exactly one
 * goalkeeper, ten outfield players and at least three defenders. Extra players go to the bench and
 * are replaced by the best available substitutes. A valid XI is returned unchanged.
 */
export function normaliseLineup(squad: Player[], lineup: Lineup): Lineup {
  const byId = new Map(squad.map((p) => [p.id, p]));
  const isArmband = (p: Player) => p.id === lineup.captainId || p.id === lineup.viceCaptainId;
  const seen = new Set<string>();
  const current = lineup.starters
    .map((id) => byId.get(id))
    .filter((p): p is Player => {
      if (!p || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  // Exactly one goalkeeper.
  const keepers = current.filter((p) => p.position === "GK");
  const keeper = keepers[0] ?? squad.find((p) => p.position === "GK");
  let outfield = current.filter((p) => p.position !== "GK");

  const defCount = () => outfield.filter((p) => p.position === "DEF").length;
  const wanted = keeper ? 10 : 11;

  // Too many outfield players: bench from the end, protecting armbands and the 3-defender minimum.
  while (outfield.length > wanted) {
    let index = -1;
    for (let i = outfield.length - 1; i >= 0; i -= 1) {
      const p = outfield[i]!;
      if (!isArmband(p) && (p.position !== "DEF" || defCount() > 3)) {
        index = i;
        break;
      }
    }
    outfield.splice(index === -1 ? outfield.length - 1 : index, 1);
  }

  // Too few: bring on subs (defenders first while we have fewer than 3).
  const pool = () =>
    benchOf(
      squad.filter((p) => p.position !== "GK"),
      outfield.map((p) => p.id),
    );
  while (outfield.length < wanted) {
    const candidates = pool();
    const next =
      (defCount() < 3 ? candidates.find((p) => p.position === "DEF") : undefined) ?? candidates[0];
    if (!next) break;
    outfield.push(next);
  }

  // At least three defenders: swap a non-defender out for a bench defender.
  while (defCount() < 3) {
    const inDef = pool().find((p) => p.position === "DEF");
    let outIndex = -1;
    for (let i = outfield.length - 1; i >= 0; i -= 1) {
      const p = outfield[i]!;
      if (p.position !== "DEF" && !isArmband(p)) {
        outIndex = i;
        break;
      }
    }
    if (!inDef || outIndex === -1) break;
    outfield = outfield.map((p, i) => (i === outIndex ? inDef : p));
  }

  const finalXI = [...(keeper ? [keeper] : []), ...outfield];
  const ids = finalXI.map((p) => p.id);
  const outfieldIds = outfield.map((p) => p.id);

  let captainId = lineup.captainId && ids.includes(lineup.captainId) ? lineup.captainId : null;
  let viceCaptainId =
    lineup.viceCaptainId && ids.includes(lineup.viceCaptainId) && lineup.viceCaptainId !== captainId
      ? lineup.viceCaptainId
      : null;
  captainId ??=
    outfieldIds.find((id) => id !== viceCaptainId) ??
    ids.find((id) => id !== viceCaptainId) ??
    null;
  viceCaptainId ??=
    outfieldIds.find((id) => id !== captainId) ?? ids.find((id) => id !== captainId) ?? null;

  return { starters: ids, captainId, viceCaptainId };
}

/** True when both lineups start the same eleven players (armbands ignored). */
export function sameStarters(a: Lineup, b: Lineup): boolean {
  return (
    a.starters.length === b.starters.length && a.starters.every((id) => b.starters.includes(id))
  );
}

/** Applies a substitution. The armband passes to the incoming player if the captain goes off. */
export function substitute(lineup: Lineup, outId: string, inId: string): Lineup {
  return {
    starters: lineup.starters.map((id) => (id === outId ? inId : id)),
    captainId: lineup.captainId === outId ? inId : lineup.captainId,
    viceCaptainId: lineup.viceCaptainId === outId ? inId : lineup.viceCaptainId,
  };
}

export function setCaptain(lineup: Lineup, playerId: string): Lineup {
  if (!lineup.starters.includes(playerId)) return lineup;
  return {
    ...lineup,
    captainId: playerId,
    // Captain and vice must be different people.
    viceCaptainId: lineup.viceCaptainId === playerId ? lineup.captainId : lineup.viceCaptainId,
  };
}

export function setViceCaptain(lineup: Lineup, playerId: string): Lineup {
  if (!lineup.starters.includes(playerId)) return lineup;
  return {
    ...lineup,
    viceCaptainId: playerId,
    captainId: lineup.captainId === playerId ? lineup.viceCaptainId : lineup.captainId,
  };
}

export function sameLineup(a: Lineup, b: Lineup): boolean {
  return (
    a.captainId === b.captainId &&
    a.viceCaptainId === b.viceCaptainId &&
    a.starters.length === b.starters.length &&
    a.starters.every((id) => b.starters.includes(id))
  );
}

/** Substitutions are only open before the gameweek deadline. */
export function isLineupLocked(gameweek: Gameweek | null | undefined, now = Date.now()): boolean {
  if (!gameweek) return false;
  if (gameweek.status !== "upcoming") return true;
  const deadline = Date.parse(gameweek.deadline);
  return Number.isFinite(deadline) && now >= deadline;
}