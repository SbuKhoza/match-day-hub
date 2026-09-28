import { Link } from "@tanstack/react-router";
import { ChevronRight, Users } from "lucide-react";

import { Card } from "@/components/common/Card";
import { useFantasyDb, useGameweek, useLeague, usePlayerPoints } from "@/hooks/useFantasy";
import { calculateGameweek, calculateOverall } from "@/services/scoringService";
import type { League } from "@/types/fantasy";
import { ordinal } from "@/utils/format";

/**
 * Mini-league row for the Fantasy hub: icon, name, meta line and the signed-in
 * user's current position (ranked by total points, same rule as the league page).
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

  return (
    <Link to="/fantasy/leagues/$leagueId" params={{ leagueId: league.id }} className="block">
      <Card className="transition-shadow hover:shadow-lifted">
        <div className="flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Users className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{league.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {league.memberUids.length} members · Code {league.code}
            </p>
          </div>
          <div className="self-stretch border-l border-border pl-3 text-center">
            <p className="text-[11px] text-muted-foreground">Position</p>
            <p className="text-sm font-semibold tabular-nums">
              {index >= 0 ? ordinal(index + 1) : "—"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
      </Card>
    </Link>
  );
}