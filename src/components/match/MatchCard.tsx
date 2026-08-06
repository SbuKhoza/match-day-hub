import { Link } from "@tanstack/react-router";

import { Card, CardBody } from "@/components/common/Card";
import { LiveBadge } from "@/components/common/LiveBadge";
import { TeamBadge } from "@/components/common/TeamBadge";
import { getTeam } from "@/services/mockData";
import type { Match } from "@/types";
import { formatKickoff } from "@/utils/format";

export function MatchCard({ match }: { match: Match }) {
  const home = getTeam(match.home.id);
  const away = getTeam(match.away.id);

  return (
    <Card>
      <CardBody className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[11px] uppercase tracking-widest text-muted-foreground">
            {match.competition}
          </span>
          {match.status === "live" ? (
            <LiveBadge minute={match.minute} />
          ) : (
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
              {match.status === "finished" ? "Full time" : formatKickoff(match.kickoff)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/match-center/$teamId"
            params={{ teamId: match.home.id }}
            className="flex min-w-0 flex-1 items-center gap-2 hover:underline"
          >
            <TeamBadge team={{ ...match.home, primary: home?.primary }} size="sm" />
            <span className="truncate text-sm font-medium">{match.home.name}</span>
          </Link>
          <span className="shrink-0 text-lg font-semibold tabular-nums">
            {match.status === "upcoming" ? "vs" : `${match.homeScore ?? 0} – ${match.awayScore ?? 0}`}
          </span>
          <Link
            to="/match-center/$teamId"
            params={{ teamId: match.away.id }}
            className="flex min-w-0 flex-1 items-center justify-end gap-2 hover:underline"
          >
            <span className="truncate text-right text-sm font-medium">{match.away.name}</span>
            <TeamBadge team={{ ...match.away, primary: away?.primary }} size="sm" />
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
