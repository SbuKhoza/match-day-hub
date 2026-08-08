import { History } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { EVENT_LABEL, useFantasyAudit } from "@/hooks/useFantasyAudit";
import { getTeam } from "@/services/mockData";
import { cn } from "@/lib/utils";

/** Chronological record of the live events that moved the user's fantasy total. */
export function PointsAuditTrail() {
  const entries = useFantasyAudit();

  return (
    <Card>
      <CardBody>
        <h2 className="text-lg font-semibold">Points audit trail</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every live event involving your squad and exactly what it did to your total.
        </p>

        {entries.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-border px-3 py-2.5 text-sm",
                  entry.countsToTotal ? "" : "opacity-70",
                )}
              >
                <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {entry.event.minute}'
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {entry.playerName}
                  {entry.captain ? " (C)" : ""}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {EVENT_LABEL[entry.event.type]} · {getTeam(entry.event.teamId)?.shortName ?? ""}
                  {entry.countsToTotal ? "" : " · bench"}
                </span>
                <span className="w-12 shrink-0 text-right font-semibold tabular-nums">
                  {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                </span>
                <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {entry.countsToTotal ? `= ${entry.runningTotal}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={History}
              title="No scoring events yet"
              description="As soon as one of your players is involved in a live incident, it is logged here."
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
