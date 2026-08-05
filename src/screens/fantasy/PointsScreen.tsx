import { Star } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { StatTile } from "@/components/fantasy/StatTile";
import { cn } from "@/lib/utils";
import { useFantasyTeam, useGameweek, usePlayerPoints } from "@/hooks/useFantasy";
import { SCORING_RULES, calculateGameweek, calculateOverall } from "@/services/scoringService";

export function PointsScreen() {
  const { data: team } = useFantasyTeam();
  const { data: gameweek } = useGameweek();
  const { data: points = [], isFetching } = usePlayerPoints();

  const gw = gameweek?.number ?? 0;
  const result = team ? calculateGameweek(team, points, gw) : null;
  const overall = team ? calculateOverall(team, points) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Points" subtitle={`Gameweek ${gw} scoring, updated live.`} />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Gameweek" value={String(result?.total ?? 0)} icon={Star} />
        <StatTile label="Overall" value={String(overall)} />
        <StatTile label="Captain bonus" value={String(result?.captainBonus ?? 0)} />
        <StatTile label="Bench" value={String(result?.benchPoints ?? 0)} />
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Player breakdown</h2>
            {isFetching ? <span className="text-xs text-muted-foreground">Updating…</span> : null}
          </div>
          {result && result.rows.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {result.rows.map((row) => (
                <li
                  key={row.playerId}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-border px-3 py-2.5 text-sm",
                    row.starting ? "" : "opacity-70",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {row.name}
                    {row.captain ? " (C)" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {row.starting ? "Starting" : "Bench"}
                  </span>
                  <span className="w-10 text-right font-semibold tabular-nums">{row.points}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Star}
                title="No points yet"
                description="Scores appear here as soon as your squad is saved and gameweek data lands."
              />
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">Scoring rules</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {SCORING_RULES.map((rule) => (
              <li
                key={rule.key}
                className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm"
              >
                <span>{rule.label}</span>
                <span className="font-semibold tabular-nums">
                  {rule.points > 0 ? `+${rule.points}` : rule.points}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
