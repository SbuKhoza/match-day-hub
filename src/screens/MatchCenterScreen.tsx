import { useMemo, useState } from "react";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, ErrorMessage, LoadingState } from "@/components/common/DataState";
import { LiveDataFooter } from "@/components/common/LiveDataFooter";
import { PageHeader } from "@/components/common/PageHeader";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchTimeline } from "@/components/match/MatchTimeline";
import { TopScorersTable } from "@/components/match/TopScorersTable";
import { useAuth } from "@/hooks/useAuth";
import { useTeam } from "@/hooks/useMasterData";
import { useLeagueMatches, useLiveMatches, useStandings } from "@/hooks/useSportsData";
import { cn } from "@/lib/utils";
import { StandingsTable } from "@/components/match/StandingsTable";

const TABS = ["Live", "Results", "Fixtures", "Table", "Scorers"] as const;
type Tab = (typeof TABS)[number];

const KICKOFF_FILTERS = ["Any time", "Today", "Next 7 days"] as const;
type KickoffFilter = (typeof KICKOFF_FILTERS)[number];

export function MatchCenterScreen() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("Live");
  const [competition, setCompetition] = useState("All");
  const [kickoff, setKickoff] = useState<KickoffFilter>("Any time");

  const favourite = useTeam(profile?.favoriteTeam ?? null);
  const highlightSlug = favourite.data?.sportscoreSlug ?? undefined;

  const standings = useStandings();
  const liveFeed = useLiveMatches();
  const needsSchedule = tab === "Results" || tab === "Fixtures";
  const league = useLeagueMatches(needsSchedule);

  const live = liveFeed.matches.filter((match) => match.status === "live");

  const competitions = useMemo(
    () => ["All", ...new Set(league.matches.map((match) => match.competition).filter(Boolean))],
    [league.matches],
  );

  const inWindow = (startTime: string | null) => {
    if (kickoff === "Any time" || !startTime) return kickoff === "Any time";
    const time = new Date(startTime).getTime();
    if (kickoff === "Today") return new Date(startTime).toDateString() === new Date().toDateString();
    return time >= Date.now() && time <= Date.now() + 7 * 86_400_000;
  };

  const results = league.matches
    .filter((match) => match.status === "finished")
    .filter((match) => competition === "All" || match.competition === competition)
    .sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""))
    .slice(0, 30);

  const fixtures = league.matches
    .filter((match) => match.status === "upcoming")
    .filter((match) => competition === "All" || match.competition === competition)
    .filter((match) => inWindow(match.startTime))
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
    .slice(0, 30);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match Center"
        subtitle="Live games, results, fixtures and the league table for every club."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
              tab === item ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            )}
          >
            {item}
            {item === "Live" && live.length > 0 ? ` (${live.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "Live" ? (
        <div className="space-y-4">
          {liveFeed.isLoading ? <LoadingState label="Loading live matches…" /> : null}
          {liveFeed.isError && live.length === 0 ? (
            <ErrorMessage detail={liveFeed.meta.error} onRetry={() => void liveFeed.refetch()} />
          ) : null}
          {!liveFeed.isLoading && live.length === 0 ? (
            <EmptyMessage
              title="No matches in progress right now."
              description="Live scores and match events appear here as soon as a game kicks off."
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {live.map((match) => (
              <div key={match.id} className="space-y-2">
                <MatchCard match={match} />
                <Card>
                  <CardBody className="space-y-2 p-4">
                    <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Timeline
                    </h3>
                    <MatchTimeline match={match} />
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
          <LiveDataFooter meta={liveFeed.meta} />
        </div>
      ) : null}

      {tab === "Results" || tab === "Fixtures" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border p-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-competition"
                className="text-[11px] uppercase tracking-widest text-muted-foreground"
              >
                Competition
              </label>
              <select
                id="filter-competition"
                value={competition}
                onChange={(event) => setCompetition(event.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {competitions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            {tab === "Fixtures" ? (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="filter-kickoff"
                  className="text-[11px] uppercase tracking-widest text-muted-foreground"
                >
                  Kick-off
                </label>
                <select
                  id="filter-kickoff"
                  value={kickoff}
                  onChange={(event) => setKickoff(event.target.value as KickoffFilter)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {KICKOFF_FILTERS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setCompetition("All");
                setKickoff("Any time");
              }}
              className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              Reset
            </button>
          </div>

          {league.isLoading ? <LoadingState label="Loading the season schedule…" /> : null}
          {league.isError ? <ErrorMessage detail={league.meta.error} /> : null}
          {!league.isLoading && (tab === "Results" ? results : fixtures).length === 0 ? (
            <EmptyMessage
              title={tab === "Results" ? "No results available." : "No fixtures available."}
            />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {(tab === "Results" ? results : fixtures).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
          <LiveDataFooter meta={league.meta} />
        </div>
      ) : null}

      {tab === "Table" ? (
        <div className="space-y-3">
          {standings.isLoading ? <LoadingState label="Loading the league table…" /> : null}
          {standings.isError && standings.rows.length === 0 ? (
            <ErrorMessage detail={standings.meta.error} onRetry={() => void standings.refetch()} />
          ) : null}
          {!standings.isLoading && standings.rows.length === 0 ? (
            <EmptyMessage title="No standings available." />
          ) : null}
          {standings.rows.length > 0 ? (
            <Card>
              <CardBody className="p-4">
                <StandingsTable rows={standings.rows} highlightSlug={highlightSlug} />
              </CardBody>
            </Card>
          ) : null}
          <LiveDataFooter meta={standings.meta} />
        </div>
      ) : null}

      {tab === "Scorers" ? <TopScorersTable /> : null}
    </div>
  );
}
