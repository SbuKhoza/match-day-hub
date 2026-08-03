import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { LiveBadge } from "@/components/common/LiveBadge";
import { TeamBadge } from "@/components/common/TeamBadge";
import type { LeagueStanding, Match, Team } from "@/types";
import { formatKickoff, ordinal, relativeDay } from "@/utils/format";

function FormPips({ form }: { form: LeagueStanding["form"] }) {
  return (
    <div className="flex gap-1.5">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className="flex h-6 w-6 items-center justify-center rounded-lg border border-border text-[11px] font-semibold text-muted-foreground"
        >
          {result}
        </span>
      ))}
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
    <Card className="shadow-lifted">
      <CardBody className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <TeamBadge team={team} size="xl" />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {team.league}
              </p>
              <h2 className="text-2xl font-semibold sm:text-3xl">{team.name}</h2>
            </div>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Change team
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Position</p>
            <p className="mt-1 text-2xl font-semibold">{ordinal(standing.position)}</p>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Points</p>
            <p className="mt-1 text-2xl font-semibold">
              {standing.points}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {standing.played} pl
              </span>
            </p>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Form</p>
            <div className="mt-2">
              <FormPips form={standing.form} />
            </div>
          </div>
        </div>

        {live ? (
          <div className="rounded-3xl border border-live/30 bg-live/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <LiveBadge minute={live.minute} />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {live.competition}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="flex items-center gap-3">
                <TeamBadge team={live.home} size="sm" />
                <span className="text-sm font-medium">{live.home.name}</span>
              </span>
              <span className="text-3xl font-semibold tabular-nums">
                {live.homeScore} – {live.awayScore}
              </span>
              <span className="flex items-center gap-3">
                <span className="hidden text-sm font-medium sm:inline">{live.away.name}</span>
                <TeamBadge team={live.away} size="sm" />
              </span>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-border p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Previous result
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">
                {previous.home.shortName} vs {previous.away.shortName}
              </span>
              <span className="text-xl font-semibold tabular-nums">
                {previous.homeScore} – {previous.awayScore}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {previous.competition} · {relativeDay(previous.kickoff)}
            </p>
          </div>

          <div className="rounded-3xl border border-border p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Next match</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">
                {next.home.shortName} vs {next.away.shortName}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {relativeDay(next.kickoff)}
              </span>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatKickoff(next.kickoff)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {next.venue}
              </span>
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}