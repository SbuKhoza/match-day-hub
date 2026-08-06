import { CircleDot, Square, Zap } from "lucide-react";

import type { LiveEvent } from "@/contexts/LiveContext";
import { getTeam } from "@/services/mockData";

const ICONS = { goal: CircleDot, assist: Zap, yellow: Square, red: Square } as const;
const LABELS = { goal: "Goal", assist: "Assist", yellow: "Yellow card", red: "Red card" } as const;

export function EventFeed({ events }: { events: LiveEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No events yet — goals and cards appear here the moment they happen.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {events.slice(0, 12).map((event) => {
        const Icon = ICONS[event.type];
        return (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 text-sm"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{event.playerName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {LABELS[event.type]} · {getTeam(event.teamId)?.shortName ?? ""}
            </span>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {event.minute}'
            </span>
          </li>
        );
      })}
    </ul>
  );
}
