import { Link } from "@tanstack/react-router";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { LiveDataFooter } from "@/components/common/LiveDataFooter";
import { SectionHeader } from "@/components/common/SectionHeader";
import { TeamBadge } from "@/components/common/TeamBadge";
import { MatchCard } from "@/components/match/MatchCard";
import { StatTile } from "@/components/fantasy/StatTile";
import { useAuth } from "@/hooks/useAuth";
import { useTeam } from "@/hooks/useMasterData";
import { useStandings, useTeamMatches } from "@/hooks/useSportsData";

export function HomeScreen() {
  const { profile, user } = useAuth();
  const firstName = (profile?.name ?? user?.displayName ?? "there").split(" ")[0];

  const favourite = useTeam(profile?.favoriteTeam ?? null);
  const slug = favourite.data?.sportscoreSlug ?? null;

  const standings = useStandings();
  const teamMatches = useTeamMatches(slug);

  const row = standings.rows.find((entry) => entry.team.slug === slug);
  const live = teamMatches.matches.filter((match) => match.status === "live");
  const previous = teamMatches.matches
    .filter((match) => match.status === "finished")
    .sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""))[0];
  const next = teamMatches.matches
    .filter((match) => match.status === "upcoming")
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))[0];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{firstName}</h1>
      </header>

      {!profile?.favoriteTeam || !favourite.data ? (
        <EmptyMessage
          title="No club selected yet."
          description="Choose your club once the club list has been imported, and your results and fixtures appear here."
          action={
            <Link to="/profile" className="text-sm font-medium underline">
              Go to profile
            </Link>
          }
        />
      ) : (
        <section className="space-y-3">
          <Card>
            <CardBody className="space-y-3 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <TeamBadge
                  team={{
                    name: favourite.data.teamName,
                    shortName: favourite.data.shortName,
                    logo: favourite.data.logo ?? row?.team.logo ?? null,
                  }}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Your club
                  </p>
                  <h2 className="truncate text-lg font-semibold sm:text-xl">
                    {favourite.data.teamName}
                  </h2>
                </div>
                <Link
                  to="/profile"
                  className="ml-auto shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Change
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Position" value={row ? String(row.position) : "—"} />
                <StatTile label="Points" value={row ? String(row.points) : "—"} />
                <StatTile label="Played" value={row ? String(row.played) : "—"} />
                <StatTile label="Goal diff" value={row ? String(row.goalDifference) : "—"} />
              </div>
            </CardBody>
          </Card>

          {!slug ? (
            <EmptyMessage
              title="This club is not linked to the live data feed yet."
              description="Add the club's data-provider reference in the import file to see fixtures and results."
            />
          ) : teamMatches.isLoading ? (
            <LoadingState label="Loading your club's matches…" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {live.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
              {previous ? <MatchCard match={previous} /> : null}
              {next ? <MatchCard match={next} /> : null}
              {!previous && !next && live.length === 0 ? (
                <EmptyMessage title="No fixtures available." />
              ) : null}
            </div>
          )}
          <LiveDataFooter meta={teamMatches.meta} />
        </section>
      )}

      <section>
        <SectionHeader title="League table" subtitle="Live Premier Soccer League standings" to="/match-center" />
        {standings.isLoading ? (
          <LoadingState label="Loading the league table…" />
        ) : standings.rows.length === 0 ? (
          <EmptyMessage title="No standings available." />
        ) : (
          <Card>
            <CardBody className="p-4">
              <ul className="space-y-2 text-sm">
                {standings.rows.slice(0, 5).map((entry) => (
                  <li key={entry.team.slug} className="flex items-center gap-3">
                    <span className="w-5 text-right tabular-nums text-muted-foreground">
                      {entry.position}
                    </span>
                    <TeamBadge team={entry.team} size="sm" className="h-7 w-7" />
                    <span className="min-w-0 flex-1 truncate">{entry.team.name}</span>
                    <span className="tabular-nums font-semibold">{entry.points}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
        <LiveDataFooter meta={standings.meta} />
      </section>
    </div>
  );
}
