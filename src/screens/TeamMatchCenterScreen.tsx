import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, ErrorMessage, LoadingState } from "@/components/common/DataState";
import { LiveDataFooter } from "@/components/common/LiveDataFooter";
import { PageHeader } from "@/components/common/PageHeader";
import { TeamBadge } from "@/components/common/TeamBadge";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchLineups, MatchTimeline } from "@/components/match/MatchTimeline";
import { StandingsTable } from "@/components/match/StandingsTable";
import { StatTile } from "@/components/fantasy/StatTile";
import { TeamSquad } from "@/components/team/TeamSquad";
import { useTeams } from "@/hooks/useMasterData";
import { useStandings, useTeamMatches } from "@/hooks/useSportsData";
import { nameKey } from "@/services/sportscore/normalize";

/** `teamId` here is the football data provider's club slug. */
export function TeamMatchCenterScreen({ teamId }: { teamId: string }) {
  const standings = useStandings();
  const teams = useTeams();
  const { matches, isLoading, isError, meta } = useTeamMatches(teamId);

  const row = standings.rows.find((entry) => entry.team.slug === teamId);
  const providerTeam = row?.team ?? matches[0]?.home ?? null;
  const displayName = providerTeam?.name ?? teamId.replace(/-/g, " ");

  /** Links the provider club to the imported master club record, if one exists. */
  const masterTeam = useMemo(() => {
    const list = teams.data ?? [];
    return (
      list.find((team) => team.sportscoreSlug === teamId) ??
      list.find((team) => nameKey(team.teamName) === nameKey(displayName)) ??
      null
    );
  }, [teams.data, teamId, displayName]);

  const live = matches.filter((match) => match.status === "live");
  const results = matches
    .filter((match) => match.status === "finished")
    .sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""));
  const fixtures = matches
    .filter((match) => match.status === "upcoming")
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

  if (!isLoading && !row && matches.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Club not found" subtitle="No data is available for this club." />
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
        <ArrowLeft className="h-4 w-4" aria-hidden /> Match Center
      </Link>

      <div className="flex items-center gap-4">
        <TeamBadge
          team={{ name: displayName, shortName: providerTeam?.shortName ?? null, logo: providerTeam?.logo ?? null }}
          size="lg"
        />
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {masterTeam?.stadium ?? "Stadium not recorded"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Position" value={row ? String(row.position) : "—"} />
        <StatTile label="Points" value={row ? String(row.points) : "—"} />
        <StatTile label="Played" value={row ? String(row.played) : "—"} />
        <StatTile label="Goal diff" value={row ? String(row.goalDifference) : "—"} />
      </div>

      {isLoading ? <LoadingState label="Loading this club's matches…" /> : null}
      {isError && matches.length === 0 ? <ErrorMessage detail={meta.error} /> : null}

      {live.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Live now</h2>
          <div className="grid gap-3">
            {live.map((match) => (
              <div key={match.id} className="space-y-2">
                <MatchCard match={match} />
                <Card>
                  <CardBody className="space-y-3 p-4">
                    <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Timeline
                    </h3>
                    <MatchTimeline match={match} />
                    <h3 className="pt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                      Line-ups
                    </h3>
                    <MatchLineups match={match} />
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Squad</h2>
        <TeamSquad teamId={masterTeam?.teamId ?? null} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming fixtures</h2>
        {fixtures.length === 0 && !isLoading ? (
          <EmptyMessage title="No fixtures available." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {fixtures.slice(0, 8).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Results</h2>
        {results.length === 0 && !isLoading ? (
          <EmptyMessage title="No results available." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.slice(0, 8).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">League table</h2>
        {standings.rows.length === 0 ? (
          <EmptyMessage title="No standings available." />
        ) : (
          <Card>
            <CardBody className="p-4">
              <StandingsTable rows={standings.rows} highlightSlug={teamId} />
            </CardBody>
          </Card>
        )}
      </section>

      <LiveDataFooter meta={meta} />
    </div>
  );
}
