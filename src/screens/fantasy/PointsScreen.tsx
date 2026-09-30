import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { GameweekPitch, type GameweekPitchEntry } from "@/components/fantasy/GameweekPitch";
import { StatTile } from "@/components/fantasy/StatTile";
import { cn } from "@/lib/utils";
import { useFantasyTeam, useGameweek, usePlayerPoints, usePlayers } from "@/hooks/useFantasy";
import { SCORING_RULES, calculateGameweek, calculateOverall } from "@/services/scoringService";

export function PointsScreen() {
  const { data: team } = useFantasyTeam();
  const { data: gameweek } = useGameweek();
  const { data: points = [], isFetching } = usePlayerPoints();
  const { byId } = usePlayers();

  const currentGw = gameweek?.number ?? 0;
  const [picked, setPicked] = useState<number | null>(null);
  const selectedGw = picked ?? currentGw;

  // Every gameweek that can be viewed: 1 … the latest one with data (or the current one).
  const lastGw = Math.max(currentGw, ...points.map((entry) => entry.gameweek), 1);
  const gameweeks = useMemo(() => Array.from({ length: lastGw }, (_, i) => i + 1), [lastGw]);

  const resolveName = (playerId: string) => byId.get(playerId)?.name;
  const result = team ? calculateGameweek(team, points, selectedGw, resolveName) : null;
  const overall = team ? calculateOverall(team, points) : 0;

  const { starters, bench } = useMemo(() => {
    const empty = { starters: [] as GameweekPitchEntry[], bench: [] as GameweekPitchEntry[] };
    if (!team || !result) return empty;

    const statsByPlayer = new Map(
      points
        .filter((entry) => entry.gameweek === selectedGw)
        .map((entry) => [entry.playerId, entry.stats]),
    );

    const entries: GameweekPitchEntry[] = [];
    for (const row of result.rows) {
      const player = byId.get(row.playerId);
      if (!player) continue;
      entries.push({
        player,
        // Starters show their scored points (captain doubled); bench shows what they earned.
        points: row.starting ? row.points : row.rawPoints,
        captain: row.captain,
        vice: team.viceCaptainId === row.playerId,
        stats: statsByPlayer.get(row.playerId),
      });
    }

    const starterIds = new Set(team.starters);
    return {
      starters: entries.filter((entry) => starterIds.has(entry.player.id)),
      bench: entries.filter((entry) => !starterIds.has(entry.player.id)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, points, selectedGw, byId]);

  const canGoBack = selectedGw > 1;
  const canGoForward = selectedGw < lastGw;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Points"
        subtitle={`Gameweek ${selectedGw} — see how each player performed.`}
      />

      {/* Gameweek picker */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous gameweek"
          disabled={!canGoBack}
          onClick={() => setPicked(selectedGw - 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1" role="tablist">
          {gameweeks.map((n) => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={n === selectedGw}
              ref={(el) => {
                if (el && n === selectedGw)
                  el.scrollIntoView({ inline: "center", block: "nearest" });
              }}
              onClick={() => setPicked(n)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                n === selectedGw
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-secondary",
              )}
            >
              GW {n}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next gameweek"
          disabled={!canGoForward}
          onClick={() => setPicked(selectedGw + 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={`GW ${selectedGw}`} value={String(result?.total ?? 0)} icon={Star} />
        <StatTile label="Overall" value={String(overall)} />
        <StatTile label="Captain bonus" value={String(result?.captainBonus ?? 0)} />
        <StatTile label="Bench" value={String(result?.benchPoints ?? 0)} />
      </div>

      {/* Pitch view of the selected gameweek */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Gameweek {selectedGw} line-up</h2>
          {isFetching ? <span className="text-xs text-muted-foreground">Updating…</span> : null}
        </div>
        {team && starters.length > 0 ? (
          <GameweekPitch starters={starters} bench={bench} />
        ) : (
          <EmptyState
            icon={Star}
            title="No points yet"
            description="Scores appear here as soon as your squad is saved and gameweek data lands."
          />
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          G goals · A assists · CS clean sheet · YC/RC cards · DNP did not play. Captain (C) points
          are doubled.
        </p>
      </section>

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