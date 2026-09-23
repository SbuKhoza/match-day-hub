import { ArrowLeftRight, CircleDot, Square } from "lucide-react";

import { EmptyMessage, ErrorMessage } from "@/components/common/DataState";
import { useMatchDetail } from "@/hooks/useSportsData";
import { cn } from "@/lib/utils";
import type {
  NormalizedMatch,
  NormalizedMatchEvent,
} from "@/services/sportscore/normalize";

function EventRow({ event }: { event: NormalizedMatchEvent }) {
  const Icon =
    event.type === "goal" || event.type === "own-goal" || event.type === "penalty"
      ? CircleDot
      : event.type === "substitution"
        ? ArrowLeftRight
        : Square;

  const description =
    event.type === "substitution"
      ? `${event.playerInName ?? "—"} on for ${event.playerOutName ?? "—"}`
      : (event.playerName ?? "Player not named");

  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {event.minute === null ? "—" : `${event.minute}'`}
      </span>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary",
          event.type === "red" && "bg-destructive/15 text-destructive",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{description}</span>
      <span className="shrink-0 truncate text-xs text-muted-foreground">{event.rawType}</span>
      {event.type === "goal" && event.homeScore !== null ? (
        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary-foreground">
          {event.homeScore}–{event.awayScore}
        </span>
      ) : null}
    </li>
  );
}

/** Timeline for one fixture, straight from the football data provider. */
export function MatchTimeline({ match }: { match: NormalizedMatch }) {
  const { detail, isLoading, isError, meta } = useMatchDetail(match);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading match details…</p>;
  }
  if (isError && !detail) {
    return <ErrorMessage detail={meta.error} />;
  }
  if (!detail || detail.events.length === 0) {
    return <p className="text-xs text-muted-foreground">No match events available.</p>;
  }

  const ordered = [...detail.events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  return (
    <ul className="space-y-2">
      {ordered.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
    </ul>
  );
}

/** Confirmed line-ups, when the provider has published them. */
export function MatchLineups({ match }: { match: NormalizedMatch }) {
  const { detail, isLoading } = useMatchDetail(match);

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading line-ups…</p>;
  if (!detail?.lineups) {
    return <EmptyMessage title="No line-ups available for this match yet." />;
  }

  const { lineups } = detail;
  const columns = [
    { name: match.home.name, formation: lineups.homeFormation, players: lineups.home },
    { name: match.away.name, formation: lineups.awayFormation, players: lineups.away },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {columns.map((column) => (
        <div key={column.name} className="space-y-2">
          <h4 className="text-sm font-semibold">
            {column.name}
            {column.formation ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {column.formation}
              </span>
            ) : null}
          </h4>
          <ul className="space-y-1 text-sm">
            {column.players.map((player) => (
              <li key={`${column.name}-${player.name}`} className="flex items-center gap-2">
                <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                  {player.shirtNumber ?? "—"}
                </span>
                <span className="min-w-0 flex-1 truncate">{player.name}</span>
                {player.captain ? (
                  <span className="rounded bg-secondary px-1.5 text-[10px] font-semibold">C</span>
                ) : null}
                <span className="w-16 text-right text-[11px] text-muted-foreground">
                  {player.started ? (player.position ?? "Starting") : "Bench"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
