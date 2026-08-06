import { useContext, useMemo } from "react";

import { LiveContext } from "@/contexts/LiveContext";

export function useLive() {
  const context = useContext(LiveContext);
  if (!context) throw new Error("useLive must be used inside <LiveProvider>");
  return context;
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
