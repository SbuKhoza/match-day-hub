import { Link } from "@tanstack/react-router";

import { Card, CardBody } from "@/components/common/Card";
import { LiveBadge } from "@/components/common/LiveBadge";
import { TeamBadge } from "@/components/common/TeamBadge";
import type { NormalizedMatch } from "@/services/sportscore/normalize";
import { formatKickoff } from "@/utils/format";

function statusLabel(match: NormalizedMatch): string {
  if (match.status === "finished") return "Full time";
  if (match.status === "postponed") return match.statusText || "Postponed";
  return match.startTime ? formatKickoff(match.startTime) : (match.statusText ?? "");
}

export function MatchCard({ match }: { match: NormalizedMatch }) {
  const hasScore = match.homeScore !== null || match.awayScore !== null;

  return (
    <Card>
      <CardBody className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[11px] uppercase tracking-widest text-muted-foreground">
            {match.competition}
          </span>
          {match.status === "live" ? (
            <LiveBadge minute={match.minute ?? undefined} />
          ) : (
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
              {statusLabel(match)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/match-center/$teamId"
            params={{ teamId: match.home.slug }}
            className="flex min-w-0 flex-1 items-center gap-2 hover:underline"
          >
            <TeamBadge team={match.home} size="sm" />
            <span className="truncate text-sm font-medium">{match.home.name}</span>
          </Link>
          <span className="shrink-0 text-lg font-semibold tabular-nums">
            {hasScore ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}` : "vs"}
          </span>
          <Link
            to="/match-center/$teamId"
            params={{ teamId: match.away.slug }}
            className="flex min-w-0 flex-1 items-center justify-end gap-2 hover:underline"
          >
            <span className="truncate text-right text-sm font-medium">{match.away.name}</span>
            <TeamBadge team={match.away} size="sm" />
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
