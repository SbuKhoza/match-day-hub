import { Clock, Lock } from "lucide-react";

import type { EditTarget } from "@/services/gameweekService";
import { formatKickoff } from "@/utils/format";

function countdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Tells the manager which gameweek their changes apply to and when it locks. After a deadline
 * passes, the gameweek in play is frozen and edits roll over to the next one.
 */
export function DeadlineBanner({ target, now }: { target: EditTarget | null; now: number }) {
  if (!target) return null;

  return (
    <div className="space-y-2">
      {target.rolledOver && target.lockedGameweek ? (
        <p className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-muted-foreground">
          <Lock className="mt-px h-4 w-4 shrink-0" />
          <span>
            The deadline for gameweek {target.lockedGameweek.number} has passed, so that team is
            locked. Anything you change now applies to gameweek {target.number}.
          </span>
        </p>
      ) : null}
      {target.deadline !== null ? (
        <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>
            Gameweek {target.number} deadline{" "}
            <span className="font-semibold">{formatKickoff(new Date(target.deadline).toISOString())}</span>
            {" · "}
            <span className="text-muted-foreground">closes in {countdown(target.deadline - now)}</span>
          </span>
        </p>
      ) : null}
    </div>
  );
}