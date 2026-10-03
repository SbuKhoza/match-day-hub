import { Link } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";

import { useFantasyDb, useGameweek, useLeague, usePlayerPoints } from "@/hooks/useFantasy";
import { calculateGameweek, calculateOverall } from "@/services/scoringService";
import type { League } from "@/types/fantasy";
import { ordinal } from "@/utils/format";

/**
 * Mini-league row for the Fantasy hub: icon, name, member count and the signed-in
 * user's current position (ranked by total points, same rule as the league page).
 * The league code is intentionally not shown here; it stays inside the league screens.
 */
export function LeagueSummaryRow({ league }: { league: League }) {
  const { uid } = useFantasyDb();
  const { data } = useLeague(league.id);
  const { data: gameweek } = useGameweek();
  const { data: points = [] } = usePlayerPoints();
  const gw = gameweek?.number ?? 0;

  const ranked = (data?.teams ?? [])
    .map((team) => ({
      uid: team.uid,
      total: calculateOverall(team, points),
      gw: calculateGameweek(team, points, gw).total,
    }))
    .sort((a, b) => b.total - a.total || b.gw - a.gw);
  const index = ranked.findIndex((entry) => entry.uid === uid);
  const members = league.memberUids.length;

  return (
    <Link
      to="/fantasy/leagues/$leagueId"
      params={{ leagueId: league.id }}
      className="home-card block transition-colors hover:bg-white/[0.07]"
    >
      <div className="flex items-center gap-3 p-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
          <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{league.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {members} {members === 1 ? "member" : "members"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-bold tabular-nums leading-tight">
            {index >= 0 ? ordinal(index + 1) : "—"}
          </p>
          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
            View league <ArrowRight className="h-3 w-3" aria-hidden />
          </p>
        </div>
      </div>
    </Link>
  );
}