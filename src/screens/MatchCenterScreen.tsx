import { useMemo, useState } from "react";

import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EventFeed } from "@/components/match/EventFeed";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchTimeline } from "@/components/match/MatchTimeline";
import { PlayerDetailsDrawer } from "@/components/match/PlayerDetailsDrawer";
import { PlayerSearch } from "@/components/match/PlayerSearch";
import { StandingsTable } from "@/components/match/StandingsTable";
import { useAuth } from "@/hooks/useAuth";
import { useLive } from "@/hooks/useLive";
import { cn } from "@/lib/utils";

const TABS = ["Live", "Results", "Fixtures", "Table"] as const;
type Tab = (typeof TABS)[number];

const STATUS_FILTERS = ["All", "Live", "Upcoming", "Finished"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const KICKOFF_FILTERS = ["Any time", "Today", "Next 7 days"] as const;
type KickoffFilter = (typeof KICKOFF_FILTERS)[number];

export function MatchCenterScreen() {
  const { profile } = useAuth();
  const { matches, events, table } = useLive();
  const [tab, setTab] = useState<Tab>("Live");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("All");
  const [competition, setCompetition] = useState<string>("All");
  const [kickoff, setKickoff] = useState<KickoffFilter>("Any time");

  const competitions = useMemo(
    () => ["All", ...new Set(matches.map((m) => m.competition))],
    [matches],
  );

  const matchesFilter = (match: (typeof matches)[number]) => {
    if (status === "Live" && match.status !== "live") return false;
    if (status === "Upcoming" && match.status !== "upcoming") return false;
    if (status === "Finished" && match.status !== "finished") return false;
    if (competition !== "All" && match.competition !== competition) return false;
    if (kickoff !== "Any time") {
      const time = new Date(match.kickoff).getTime();
      const now = Date.now();
      if (kickoff === "Today") {
        const day = new Date().toDateString();
        if (new Date(match.kickoff).toDateString() !== day) return false;
      } else if (time < now || time > now + 7 * 24 * 60 * 60 * 1000) {
        return false;
      }
    }
    return true;
  };

  const live = matches.filter((m) => m.status === "live");
  const results = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
    .slice(0, 24);
  const fixtures = matches
    .filter((m) => (status === "All" ? m.status === "upcoming" : true) && matchesFilter(m))
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .slice(0, 24);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match Center"
        subtitle="Live games, results, fixtures and the league table for every club."
      />

      <PlayerSearch onSelectPlayer={setPlayerId} />

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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {live.length > 0 ? (
              live.map((match) => (
                <div key={match.id} className="space-y-2">
                  <MatchCard match={match} />
                  <Card>
                    <CardBody className="space-y-2 p-4">
                      <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        Timeline
                      </h3>
                      <MatchTimeline matchId={match.id} onSelectPlayer={setPlayerId} />
                    </CardBody>
                  </Card>
                </div>
              ))
            ) : (
              <Card>
                <CardBody className="text-sm text-muted-foreground">
                  No matches in progress right now.
                </CardBody>
              </Card>
            )}
          </div>
          <Card>
            <CardBody className="space-y-3 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Live feed</h2>
              <EventFeed events={events} onSelectPlayer={setPlayerId} />
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "Results" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : null}

      {tab === "Fixtures" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border p-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-status"
                className="text-[11px] uppercase tracking-widest text-muted-foreground"
              >
                Status
              </label>
              <select
                id="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {STATUS_FILTERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
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
                onChange={(e) => setCompetition(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {competitions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-kickoff"
                className="text-[11px] uppercase tracking-widest text-muted-foreground"
              >
                Kickoff
              </label>
              <select
                id="filter-kickoff"
                value={kickoff}
                onChange={(e) => setKickoff(e.target.value as KickoffFilter)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {KICKOFF_FILTERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setStatus("All");
                setCompetition("All");
                setKickoff("Any time");
              }}
              className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              Reset
            </button>
            <span className="ml-auto text-xs text-muted-foreground" role="status">
              {fixtures.length} match{fixtures.length === 1 ? "" : "es"}
            </span>
          </div>
          {fixtures.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {fixtures.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardBody className="text-sm text-muted-foreground">
                No fixtures match these filters.
              </CardBody>
            </Card>
          )}
        </div>
      ) : null}

      {tab === "Table" ? (
        <Card>
          <CardBody className="p-4">
            <StandingsTable rows={table} highlightTeamId={profile?.favoriteTeam ?? undefined} />
          </CardBody>
        </Card>
      ) : null}

      <PlayerDetailsDrawer playerId={playerId} onClose={() => setPlayerId(null)} />
    </div>
  );
}
