import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { TeamBadge } from "@/components/common/TeamBadge";
import type { NormalizedMatch } from "@/services/sportscore/normalize";
import { formatMatchDate, formatMatchDateTime } from "@/utils/format";

function statusChip(match: NormalizedMatch): string {
  if (match.status === "finished") return "FT";
  if (match.status === "live") return match.minute ? `${match.minute}'` : "Live";
  if (match.status === "postponed") return match.statusText || "Postponed";
  return "Upcoming";
}

export function FixtureSummaryCard({
  label,
  match,
  teamSlug,
  variant = "result",
}: {
  label: string;
  match: NormalizedMatch | null;
  teamSlug: string;
  /** "result" shows the finished score date only; "fixture" shows date + kickoff time. */
  variant?: "result" | "fixture";
}) {
  const hasScore = Boolean(match) && (match!.homeScore !== null || match!.awayScore !== null);
  const dateLabel = match?.startTime
    ? variant === "fixture"
      ? formatMatchDateTime(match.startTime)
      : formatMatchDate(match.startTime)
    : "Date TBC";

  return (
    <Link to="/match-center/$teamId" params={{ teamId: teamSlug }} className="block h-full">
      <Card className="h-full transition-shadow hover:shadow-lifted">
        <CardBody className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {label}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </div>

          {!match ? (
            <p className="flex flex-1 items-center justify-center py-4 text-center text-sm text-muted-foreground">
              No fixture available.
            </p>
          ) : (
            <>
              <p className="-mt-1 text-xs text-muted-foreground">{dateLabel}</p>

              <div className="flex flex-1 items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <TeamBadge team={match.home} size="sm" />
                  <span className="w-full truncate text-center text-[11px] font-medium">
                    {match.home.shortName || match.home.name}
                  </span>
                </div>

                <span className="shrink-0 px-1 text-lg font-semibold tabular-nums">
                  {hasScore ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}` : "-"}
                </span>

                <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <TeamBadge team={match.away} size="sm" />
                  <span className="w-full truncate text-center text-[11px] font-medium">
                    {match.away.shortName || match.away.name}
                  </span>
                </div>
              </div>

              <span className="inline-flex w-fit rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
                {statusChip(match)}
              </span>
            </>
          )}
        </CardBody>
      </Card>
    </Link>
  );
}