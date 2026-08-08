import { useMemo } from "react";

import { useFantasyTeam } from "@/hooks/useFantasy";
import { useLive } from "@/hooks/useLive";
import type { LiveEvent } from "@/services/liveSyncService";
import { getPlayer } from "@/services/playerPool";

const EVENT_POINTS: Record<LiveEvent["type"], number> = {
  goal: 4,
  assist: 2,
  yellow: -1,
  red: -2,
};

export const EVENT_LABEL: Record<LiveEvent["type"], string> = {
  goal: "Goal",
  assist: "Assist",
  yellow: "Yellow card",
  red: "Red card",
};

export interface AuditEntry {
  id: string;
  event: LiveEvent;
  playerName: string;
  starting: boolean;
  captain: boolean;
  /** Points this event added to (or removed from) the gameweek total. */
  delta: number;
  countsToTotal: boolean;
  runningTotal: number;
}

/**
 * Audit trail: every live event involving a squad player, with the exact points
 * impact and the running gameweek total after it, so changes can be verified.
 */
export function useFantasyAudit(): AuditEntry[] {
  const { events } = useLive();
  const { data: team } = useFantasyTeam();

  return useMemo(() => {
    if (!team) return [];
    const squad = new Set(team.squad);
    const starters = new Set(team.starters);

    const ordered = events
      .filter((event) => squad.has(event.playerId))
      .slice()
      .reverse(); // oldest first for a running total

    let running = 0;
    const entries: AuditEntry[] = ordered.map((event) => {
      const captain = team.captainId === event.playerId;
      const starting = starters.has(event.playerId);
      const base = EVENT_POINTS[event.type];
      const delta = captain ? base * 2 : base;
      const countsToTotal = starting;
      if (countsToTotal) running += delta;
      return {
        id: event.id,
        event,
        playerName: getPlayer(event.playerId)?.name ?? event.playerName,
        starting,
        captain,
        delta,
        countsToTotal,
        runningTotal: running,
      };
    });

    return entries.reverse(); // newest first for display
  }, [events, team]);
}
