import type { MasterPlayer, MasterTeam } from "@/types/master";
import type { Player } from "@/types/fantasy";

/**
 * Turns imported master players into the shape the fantasy screens use.
 *
 * Players without a recorded position or without a fantasy price set by an
 * administrator are left out of selection rather than given invented values.
 */
export function toFantasyPlayers(players: MasterPlayer[], teams: MasterTeam[]): Player[] {
  const byTeam = new Map(teams.map((team) => [team.teamId, team]));
  return players
    .filter((player) => player.position !== null && player.fantasyPrice !== null && player.active)
    .map((player) => ({
      id: player.playerId,
      name: player.playerName,
      position: player.position!,
      clubId: player.teamId,
      clubName: byTeam.get(player.teamId)?.teamName ?? player.teamName,
      clubShort: byTeam.get(player.teamId)?.shortName ?? null,
      price: player.fantasyPrice!,
      totalPoints: player.fantasyPoints,
      form: 0,
    }));
}

/** Players that exist but cannot be selected yet, with the reason why. */
export function unselectablePlayers(players: MasterPlayer[]): { player: MasterPlayer; reason: string }[] {
  return players
    .filter((player) => player.active && (player.position === null || player.fantasyPrice === null))
    .map((player) => ({
      player,
      reason:
        player.position === null
          ? "No position recorded in the import file"
          : "No fantasy price set yet",
    }));
}
