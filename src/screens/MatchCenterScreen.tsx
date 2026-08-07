import { useState } from "react";

import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EventFeed } from "@/components/match/EventFeed";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchTimeline } from "@/components/match/MatchTimeline";
import { PlayerDetailsDrawer } from "@/components/match/PlayerDetailsDrawer";
import { StandingsTable } from "@/components/match/StandingsTable";
import { useAuth } from "@/hooks/useAuth";
import { useLive } from "@/hooks/useLive";
import { cn } from "@/lib/utils";

const TABS = ["Live", "Results", "Fixtures", "Table"] as const;
type Tab = (typeof TABS)[number];

export function MatchCenterScreen() {
  const { profile } = useAuth();
  const { matches, events, table } = useLive();
  const [tab, setTab] = useState<Tab>("Live");
  const [playerId, setPlayerId] = useState<string | null>(null);

  const live = matches.filter((m) => m.status === "live");
  const results = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
    .slice(0, 24);
  const fixtures = matches
    .filter((m) => m.status === "upcoming")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .slice(0, 24);

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
        <div className="grid gap-3 sm:grid-cols-2">
          {fixtures.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
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
