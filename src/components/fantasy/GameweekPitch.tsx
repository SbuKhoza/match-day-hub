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
          !hasData || points === 0
            ? "bg-neutral-900/85"
            : points < 0
              ? "bg-red-600"
              : points >= 8
                ? "bg-emerald-500"
                : "bg-emerald-700",
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
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
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

      <section aria-label="Substitutes" className="bg-secondary px-2 pb-3 pt-2 sm:px-6">
        <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Substitutes
        </p>
        <div className="flex items-start justify-center gap-1 sm:gap-3">
          {bench.map((entry) => (
            <div
              key={entry.player.id}
              className="flex w-[15.5%] max-w-[92px] min-w-0 flex-col items-center"
            >
              <div className="w-full rounded-md bg-[oklch(0.55_0.15_145)] pb-0.5">
                <PlayerTile entry={entry} bench />
              </div>
              <span className="mt-1 text-[10px] font-semibold text-muted-foreground">
                {entry.player.position}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}