import { SQUAD_SIZE, type FantasyTeam } from "@/types/fantasy";
import { CURRENT_SEASON } from "@/types/master";

/**
 * The team builder works once per season. A team counts as built when it is a full squad that
 * belongs to the current season. Teams saved before seasons were tracked have no `season` and are
 * treated as the current season's. When CURRENT_SEASON moves on, the builder opens up again.
 */
export function isTeamBuiltForSeason(
  team: Pick<FantasyTeam, "squad" | "season"> | null | undefined,
): boolean {
  if (!team) return false;
  if ((team.season ?? CURRENT_SEASON) !== CURRENT_SEASON) return false;
  return team.squad.length >= SQUAD_SIZE;
}

/** True when the saved team belongs to an earlier season, so saving starts a fresh one. */
export function isTeamFromPreviousSeason(team: Pick<FantasyTeam, "season"> | null | undefined): boolean {
  return Boolean(team) && (team!.season ?? CURRENT_SEASON) !== CURRENT_SEASON;
}