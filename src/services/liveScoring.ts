import { CURRENT_ROUND, type SeasonMatch } from "./leagueData";
import { PLAYERS } from "./playerPool";
import { emptyStatLine, scoreStatLine } from "./scoringService";
import type { LiveEvent } from "./liveSyncService";
import { CURRENT_GAMEWEEK } from "./fantasyService";
import type { PlayerPoints, PlayerStatLine } from "@/types/fantasy";

export const playersByClub = new Map<string, typeof PLAYERS>();
for (const player of PLAYERS) {
  const list = playersByClub.get(player.clubId) ?? [];
  list.push(player);
  playersByClub.set(player.clubId, list);
}

/**
 * Live fantasy scoring: appearances for anyone in a kicked-off current-round match,
 * clean sheets for GK/DEF once a match finishes goalless for their side, plus every
 * goal, assist and card from the event feed.
 */
export function derivePoints(matches: SeasonMatch[], events: LiveEvent[]): PlayerPoints[] {
  const stats = new Map<string, PlayerStatLine>();
  const ensure = (playerId: string) => {
    const existing = stats.get(playerId);
    if (existing) return existing;
    const created = { ...emptyStatLine(), appeared: true };
    stats.set(playerId, created);
    return created;
  };

  for (const match of matches) {
    if (match.round !== CURRENT_ROUND || match.status === "upcoming") continue;
    for (const clubId of [match.home.id, match.away.id]) {
      for (const player of playersByClub.get(clubId) ?? []) ensure(player.id);
    }
    if (match.status === "finished") {
      if ((match.awayScore ?? 0) === 0) {
        for (const p of playersByClub.get(match.home.id) ?? []) {
          if (p.position === "GK" || p.position === "DEF") ensure(p.id).cleanSheet = true;
        }
      }
      if ((match.homeScore ?? 0) === 0) {
        for (const p of playersByClub.get(match.away.id) ?? []) {
          if (p.position === "GK" || p.position === "DEF") ensure(p.id).cleanSheet = true;
        }
      }
    }
  }

  for (const event of events) {
    const line = ensure(event.playerId);
    if (event.type === "goal") line.goals += 1;
    if (event.type === "assist") line.assists += 1;
    if (event.type === "yellow") line.yellowCards += 1;
    if (event.type === "red") line.redCards += 1;
  }

  return [...stats.entries()].map(([playerId, line]) => ({
    id: `live-${CURRENT_GAMEWEEK.number}-${playerId}`,
    playerId,
    gameweek: CURRENT_GAMEWEEK.number,
    stats: line,
    points: scoreStatLine(line),
  }));
}
