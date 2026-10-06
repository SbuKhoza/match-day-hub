import { ChevronDown, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { CompactEmpty } from "@/components/fantasy/CompactEmpty";
import { FantasySubHeader } from "@/components/fantasy/FantasySubHeader";
import { GameweekPitch, type GameweekPitchEntry } from "@/components/fantasy/GameweekPitch";
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
        // Counted points (captain multiplied, bench boosted); an unboosted bench shows what it earned.
        points: row.starting || result.chips.benchBoost ? row.points : row.rawPoints,
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
    <div className="-mt-3 space-y-5 sm:-mt-4">
      <FantasySubHeader
        title="Points"
        subtitle={`Gameweek ${selectedGw} — see how each player performed`}
        right={
          isFetching ? (
            <span className="mt-2 text-[11px] text-muted-foreground">Updating…</span>
          ) : null
        }
      />

      {/* Gameweek picker */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous gameweek"
          disabled={!canGoBack}
          onClick={() => setPicked(selectedGw - 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/10 disabled:opacity-40"
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
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                n === selectedGw
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/[0.05] text-muted-foreground ring-1 ring-white/10 hover:text-foreground",
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/10 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Points summary */}
      <section className="home-card relative overflow-hidden">
        <div className="relative p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">{overall}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Overall</p>
            </div>
            <div>
              <p className="text-6xl font-bold leading-none tabular-nums">{result?.total ?? 0}</p>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                GW {selectedGw} points
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{result?.captainBonus ?? 0}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Captain bonus
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
            <span className="text-muted-foreground">
              Bench <span className="ml-1 text-sm font-bold tabular-nums text-foreground">{result?.benchPoints ?? 0}</span>
            </span>
            <span className="flex flex-wrap justify-end gap-1.5">
              {result?.chips.doubleCaptain ? (
                <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                  Double Captain active
                </span>
              ) : null}
              {result?.chips.benchBoost ? (
                <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                  Boosted: +{result.benchBoostBonus} counted
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </section>

      {/* Pitch view of the selected gameweek */}
      <section>
        <h2 className="mb-2.5 text-[15px] font-bold uppercase tracking-wide">
          Gameweek {selectedGw} line-up
        </h2>
        {team && starters.length > 0 ? (
          <GameweekPitch starters={starters} bench={bench} />
        ) : (
          <CompactEmpty
            icon={Star}
            title="No points yet"
            description="Scores appear here as soon as your squad is saved and gameweek data lands."
          />
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          G goals · A assists · CS clean sheet · YC/RC cards · DNP did not play. Captain (C) points
          are doubled. Chips: Double Captain doubles them again; Bench Boost counts the bench, +2 for anyone on 1+.
        </p>
      </section>

      <details className="group home-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[15px] font-bold uppercase tracking-wide">
          Scoring rules
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
          {SCORING_RULES.map((rule) => (
            <li
              key={rule.key}
              className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"
            >
              <span>{rule.label}</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  rule.points > 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {rule.points > 0 ? `+${rule.points}` : rule.points}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}