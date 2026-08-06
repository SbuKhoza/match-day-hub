import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { TeamBadge } from "@/components/common/TeamBadge";
import { EventFeed } from "@/components/match/EventFeed";
import { MatchCard } from "@/components/match/MatchCard";
import { StandingsTable } from "@/components/match/StandingsTable";
import { StatTile } from "@/components/fantasy/StatTile";
import { useLive } from "@/hooks/useLive";
import { useTeamSeason } from "@/hooks/useLive";
import { getTeam } from "@/services/mockData";

export function TeamMatchCenterScreen({ teamId }: { teamId: string }) {
  const { table } = useLive();
  const team = getTeam(teamId);
  const season = useTeamSeason(teamId);

  if (!team) {
    return (
      <div className="space-y-4">
        <PageHeader title="Club not found" subtitle="This club is not in the league." />
        <Link to="/match-center" className="text-sm font-medium underline">
          Back to Match Center
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/match-center"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Match Center
      </Link>

      <div className="flex items-center gap-4">
        <TeamBadge team={team} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{team.name}</h1>
          <p className="text-sm text-muted-foreground">{team.league}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Position" value={String(season.position || "—")} />
        <StatTile label="Points" value={String(season.standing?.points ?? 0)} />
        <StatTile label="Played" value={String(season.standing?.played ?? 0)} />
        <StatTile label="Goal diff" value={String(season.standing?.goalDifference ?? 0)} />
      </div>

      {season.live.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Live now</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {season.live.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Live feed</h2>
        <Card>
          <CardBody className="p-4">
            <EventFeed events={season.events} />
          </CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming fixtures</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {season.fixtures.slice(0, 6).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {season.results.slice(0, 8).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">League table</h2>
        <Card>
          <CardBody className="p-4">
            <StandingsTable rows={table} highlightTeamId={teamId} />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
