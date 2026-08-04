import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { LiveBadge } from "@/components/common/LiveBadge";
import { TeamBadge } from "@/components/common/TeamBadge";
import type { LeagueStanding, Match, Team } from "@/types";
import { formatKickoff, ordinal, relativeDay } from "@/utils/format";

function FormPips({ form }: { form: LeagueStanding["form"] }) {
  return (
    <div className="flex gap-1">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className="flex h-5 w-5 items-center justify-center rounded-md border border-border text-[10px] font-semibold text-muted-foreground"
        >
          {result}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-semibold">{children}</div>
    </div>
  );
}

export function FavoriteTeamCard({
  team,
  standing,
  previous,
  next,
  live,
}: {
  team: Team;
  standing: LeagueStanding;
  previous: Match;
  next: Match;
  live?: Match | null;
}) {
  return (
    <Card>
      <CardBody className="space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TeamBadge team={team} size="md" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {team.league}
              </p>
              <h2 className="truncate text-lg font-semibold sm:text-xl">{team.name}</h2>
            </div>
          </div>
          <Link
            to="/profile"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Change
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-secondary px-4 py-3">
          <Stat label="Position">{ordinal(standing.position)}</Stat>
          <Stat label="Points">
            {standing.points}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              / {standing.played} pl
            </span>
          </Stat>
          <Stat label="Form">
            <FormPips form={standing.form} />
          </Stat>
          {live ? (
            <div className="ml-auto flex items-center gap-3">
              <LiveBadge minute={live.minute} />
              <span className="text-sm font-semibold tabular-nums">
                {live.home.shortName} {live.homeScore} – {live.awayScore} {live.away.shortName}
              </span>
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Previous</p>
              <p className="truncate text-sm font-medium">
                {previous.home.shortName} vs {previous.away.shortName}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {relativeDay(previous.kickoff)}
                </span>
              </p>
            </div>
            <span className="shrink-0 text-base font-semibold tabular-nums">
              {previous.homeScore} – {previous.awayScore}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Next</p>
              <p className="truncate text-sm font-medium">
                {next.home.shortName} vs {next.away.shortName}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatKickoff(next.kickoff)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {next.venue}
                </span>
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
              {relativeDay(next.kickoff)}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}