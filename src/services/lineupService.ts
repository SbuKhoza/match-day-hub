import type { FantasyTeam, Gameweek, Player, PlayerPosition } from "@/types/fantasy";

/** Allowed number of starters per position in the XI (11 players in total). */
export const FORMATION_LIMITS: Record<PlayerPosition, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
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
 * Can `benchPlayer` replace `starter`? Both must already be in the squad; a like-for-like swap
 * never changes the formation, and a cross-position swap must leave a legal formation.
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