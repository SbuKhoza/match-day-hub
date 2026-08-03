import { useQuery } from "@tanstack/react-query";

import { Card, CardBody } from "@/components/common/Card";
import { LiveBadge } from "@/components/common/LiveBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { TeamBadge } from "@/components/common/TeamBadge";
import { useAuth } from "@/hooks/useAuth";
import { contentService } from "@/services/contentService";
import type { Match } from "@/types";
import { formatKickoff } from "@/utils/format";

function MatchRow({ match }: { match: Match }) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {match.competition}
          </span>
          {match.status === "live" ? (
            <LiveBadge minute={match.minute} />
          ) : (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
              {match.status === "finished" ? "Full time" : formatKickoff(match.kickoff)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-3">
            <TeamBadge team={match.home} size="sm" />
            <span className="truncate text-sm font-medium">{match.home.name}</span>
          </span>
          <span className="text-2xl font-semibold tabular-nums">
            {match.status === "upcoming" ? "vs" : `${match.homeScore} – ${match.awayScore}`}
          </span>
          <span className="flex min-w-0 items-center justify-end gap-3">
            <span className="truncate text-sm font-medium">{match.away.name}</span>
            <TeamBadge team={match.away} size="sm" />
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

export function MatchCenterScreen() {
  const { profile } = useAuth();
  const teamId = profile?.favoriteTeam ?? "arsenal";
  const { data } = useQuery({
    queryKey: ["matches", teamId],
    queryFn: () => contentService.getTeamMatches(teamId),
  });

  const matches = data ? [data.current, ...data.upcoming, data.previous] : [];

  return (
    <div>
      <PageHeader title="Match Center" subtitle="Live scores, fixtures and results." />
      <div className="grid gap-4 lg:grid-cols-2">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}