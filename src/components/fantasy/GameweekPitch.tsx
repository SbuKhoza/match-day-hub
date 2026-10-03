import { cn } from "@/lib/utils";
import { PitchSurface, Shirt } from "@/components/fantasy/Pitch";
import type { Player, PlayerPosition, PlayerStatLine } from "@/types/fantasy";

const ROWS: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];

export interface GameweekPitchEntry {
  player: Player;
  /** Points to display (already doubled for the captain). */
  points: number;
  captain: boolean;
  vice: boolean;
  /** Undefined when no stats have been stored for this player in the gameweek. */
  stats?: PlayerStatLine | undefined;
}

export interface GameweekPitchProps {
  starters: GameweekPitchEntry[];
  bench: GameweekPitchEntry[];
  className?: string;
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
}

/** "2G 1A CS YC" style summary of what the player did in the gameweek. */
function statSummary(stats?: PlayerStatLine): string {
  if (!stats) return "";
  if (!stats.appeared) return "DNP";
  const parts: string[] = [];
  if (stats.goals > 0) parts.push(`${stats.goals}G`);
  if (stats.assists > 0) parts.push(`${stats.assists}A`);
  if (stats.cleanSheet) parts.push("CS");
  if (stats.penaltySaves > 0) parts.push(`${stats.penaltySaves}PS`);
  if (stats.penaltyMisses > 0) parts.push(`${stats.penaltyMisses}PM`);
  if (stats.yellowCards > 0) parts.push(`${stats.yellowCards}YC`);
  if (stats.redCards > 0) parts.push(`${stats.redCards}RC`);
  return parts.join(" ");
}

/** Background for a points badge: grey for none/unknown, red for negative, green scale otherwise. */
function pointsTone(hasData: boolean, points: number): string {
  if (!hasData || points === 0) return "bg-neutral-900/85";
  if (points < 0) return "bg-red-600";
  return points >= 8 ? "bg-emerald-500" : "bg-emerald-700";
}

/** A substitute: no coloured block behind it, just the shirt, name, points badge and stats. */
function BenchTile({ entry }: { entry: GameweekPitchEntry }) {
  const { player, points, stats } = entry;
  const hasData = stats !== undefined;
  const summary = statSummary(stats);

  return (
    <div
      className="flex min-w-0 flex-col items-center"
      title={`${player.name} — ${hasData ? `${points} pts` : "no data"}${summary ? ` (${summary})` : ""}`}
    >
      <Shirt player={player} />
      <span className="mt-1 block w-full truncate text-center text-[10px] font-semibold leading-4 sm:text-xs">
        {shortName(player.name)}
      </span>
      <span
        className={cn(
          "mt-0.5 rounded-full px-2 text-[11px] font-bold leading-5 tabular-nums text-white sm:text-xs",
          pointsTone(hasData, points),
        )}
      >
        {hasData ? points : "–"}
      </span>
      <span className="mt-0.5 block h-3 w-full truncate text-center text-[9px] leading-3 text-muted-foreground sm:text-[10px]">
        {summary}
      </span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {player.position}
      </span>
    </div>
  );
}

function PlayerTile({ entry, bench = false }: { entry: GameweekPitchEntry; bench?: boolean }) {
  const { player, points, captain, vice, stats } = entry;
  const hasData = stats !== undefined;
  const summary = statSummary(stats);

  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 flex-col items-center pt-1",
        bench && "opacity-90",
      )}
      title={`${player.name} — ${hasData ? `${points} pts` : "no data"}${summary ? ` (${summary})` : ""}`}
    >
      <span className="relative">
        <Shirt player={player} />
        {captain ? (
          <span className="absolute -right-1.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-neutral-900 shadow">
            C
          </span>
        ) : null}
        {vice && !captain ? (
          <span className="absolute -right-1.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-bold text-white shadow ring-1 ring-white">
            V
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block w-full truncate bg-white px-0.5 text-center text-[10px] font-semibold leading-4 text-neutral-900 sm:text-xs sm:leading-5">
        {shortName(player.name)}
      </span>
      <span
        className={cn(
          "block w-full truncate px-0.5 text-center text-[11px] font-bold leading-4 tabular-nums text-white sm:text-xs sm:leading-5",
          pointsTone(hasData, points),
        )}
      >
        {hasData ? points : "–"}
      </span>
      <span className="block h-3.5 w-full truncate text-center text-[9px] leading-3.5 text-white/90 sm:text-[10px]">
        {summary}
      </span>
    </div>
  );
}

/**
 * A gameweek scorecard in pitch form: the starting XI on the pitch (GK at the top, forwards at
 * the bottom), each shirt showing the points that player earned, with the bench underneath.
 */
export function GameweekPitch({ starters, bench, className }: GameweekPitchProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/10", className)}>
      <PitchSurface className="rounded-none border-0">
        <div className="flex flex-col gap-3 sm:gap-5">
          {ROWS.map((position) => {
            const inRow = starters.filter((entry) => entry.player.position === position);
            if (inRow.length === 0) return null;
            return (
              <div
                key={position}
                className="flex items-start justify-center gap-1 sm:gap-3"
                role="group"
                aria-label={`Starting ${position}`}
              >
                {inRow.map((entry) => (
                  <div key={entry.player.id} className="w-[15.5%] max-w-[92px] min-w-0">
                    <PlayerTile entry={entry} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </PitchSurface>

      <section aria-label="Substitutes" className="px-3 pb-3 pt-3 sm:px-6">
        <div className="mb-2.5 flex items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Substitutes
          </p>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-6 gap-1 sm:gap-3">
          {bench.map((entry) => (
            <BenchTile key={entry.player.id} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}