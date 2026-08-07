import { CircleDot, Square, Zap } from "lucide-react";

import { useMatchTimeline } from "@/hooks/useLive";
import { cn } from "@/lib/utils";
import { getTeam } from "@/services/mockData";
import type { LiveEvent } from "@/services/liveSyncService";

const ICONS = { goal: CircleDot, assist: Zap, yellow: Square, red: Square } as const;
const LABELS = { goal: "Goal", assist: "Assist", yellow: "Yellow card", red: "Red card" } as const;

export function MatchTimelineRow({
  event,
  onSelectPlayer,
}: {
  event: LiveEvent;
  onSelectPlayer?: (playerId: string) => void;
}) {
  const Icon = ICONS[event.type];
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {event.minute}'
      </span>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary",
          event.type === "red" && "bg-destructive/15 text-destructive",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <button
        type="button"
        onClick={() => onSelectPlayer?.(event.playerId)}
        className="min-w-0 flex-1 truncate text-left font-medium hover:underline"
      >
        {event.playerName}
      </button>
      <span className="shrink-0 truncate text-xs text-muted-foreground">
        {LABELS[event.type]} · {getTeam(event.teamId)?.shortName ?? ""}
      </span>
      {event.type === "goal" ? (
        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary-foreground">
          {event.homeScore}–{event.awayScore}
        </span>
      ) : null}
    </li>
  );
}

/** Live timeline for a single fixture: goals, assists, cards and score changes. */
export function MatchTimeline({
  matchId,
  onSelectPlayer,
}: {
  matchId: string;
  onSelectPlayer?: (playerId: string) => void;
}) {
  const events = useMatchTimeline(matchId);

  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No incidents yet — goals, assists and cards appear here live.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <MatchTimelineRow key={event.id} event={event} onSelectPlayer={onSelectPlayer} />
      ))}
    </ul>
  );
}
