import { useContext, useEffect, useMemo } from "react";

import { LiveContext } from "@/contexts/LiveContext";
import { getPlayer } from "@/services/playerPool";
import { scoreStatLine } from "@/services/scoringService";
import { emptyStatLine } from "@/services/scoringService";

export function useLive() {
  const context = useContext(LiveContext);
  if (!context) throw new Error("useLive must be used inside <LiveProvider>");
  return context;
}

/**
 * Holds back live re-renders while a focused flow (squad building, transfers) is open,
 * so background syncing never moves the UI under the user. Buffered updates are applied
 * as soon as the flow closes.
 */
export function useQuietLiveUpdates(active = true) {
  const { pauseUpdates, resumeUpdates } = useLive();
  useEffect(() => {
    if (!active) return;
    pauseUpdates();
    return resumeUpdates;
  }, [active, pauseUpdates, resumeUpdates]);
}

/** Every match for one club, split into live / results / fixtures. */
export function useTeamSeason(teamId: string) {
  const { matches, events, table } = useLive();
  return useMemo(() => {
    const teamMatches = matches.filter((m) => m.home.id === teamId || m.away.id === teamId);
    return {
      live: teamMatches.filter((m) => m.status === "live"),
      results: teamMatches
        .filter((m) => m.status === "finished")
        .sort((a, b) => b.kickoff.localeCompare(a.kickoff)),
      fixtures: teamMatches
        .filter((m) => m.status === "upcoming")
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
      events: events.filter((e) => e.teamId === teamId),
      standing: table.find((row) => row.teamId === teamId),
      position: table.findIndex((row) => row.teamId === teamId) + 1,
    };
  }, [matches, events, table, teamId]);
}

/** Chronological timeline for one fixture. */
export function useMatchTimeline(matchId: string) {
  const { events } = useLive();
  return useMemo(
    () => events.filter((e) => e.matchId === matchId).sort((a, b) => a.minute - b.minute),
    [events, matchId],
  );
}

/** Per-match stats and the fantasy points impact for one player. */
export function usePlayerLive(playerId: string | null) {
  const { events, matches, livePoints } = useLive();
  return useMemo(() => {
    if (!playerId) return null;
    const player = getPlayer(playerId);
    const points = livePoints.find((entry) => entry.playerId === playerId) ?? null;
    const playerEvents = events.filter((e) => e.playerId === playerId);

    const matchIds = [
      ...new Set([
        ...playerEvents.map((e) => e.matchId),
        ...matches
          .filter(
            (m) =>
              m.status !== "upcoming" &&
              (m.home.id === player?.clubId || m.away.id === player?.clubId),
          )
          .slice(0, 1)
          .map((m) => m.id),
      ]),
    ];

    const perMatch = matchIds.map((matchId) => {
      const match = matches.find((m) => m.id === matchId)!;
      const own = playerEvents.filter((e) => e.matchId === matchId);
      const stats = { ...emptyStatLine(), appeared: true };
      for (const e of own) {
        if (e.type === "goal") stats.goals += 1;
        if (e.type === "assist") stats.assists += 1;
        if (e.type === "yellow") stats.yellowCards += 1;
        if (e.type === "red") stats.redCards += 1;
      }
      if (
        match?.status === "finished" &&
        (player?.position === "GK" || player?.position === "DEF")
      ) {
        const conceded =
          match.home.id === player?.clubId ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
        stats.cleanSheet = conceded === 0;
      }
      return { match, events: own, stats, points: scoreStatLine(stats) };
    });

    return { player, points, events: playerEvents, perMatch };
  }, [playerId, events, matches, livePoints]);
}
