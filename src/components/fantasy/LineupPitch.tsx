import { cn } from "@/lib/utils";
import type { Player } from "@/types/fantasy";

import { PitchSurface, PlayerCard } from "./Pitch";

const ROWS = ["GK", "DEF", "MID", "FWD"] as const;

export interface LineupPitchProps {
  /** The starting XI. Rendered on the pitch, one row per position. */
  starters: Player[];
  /** Substitutes. Rendered in a strip below the pitch. */
  bench: Player[];
  captainId: string | null;
  viceCaptainId: string | null;
  selectedId: string | null;
  /** Players that can legally be swapped with the current selection. */
  targetIds: ReadonlySet<string>;
  onPlayerClick?: ((player: Player) => void) | undefined;
  className?: string;
}

/**
 * The gameweek line-up: the XI on the pitch (GK at the top, forwards at the bottom) with the
 * substitutes on a bench strip underneath. Only players already in the squad are ever shown, so
 * there are no "+" slots and nobody can be brought in from the wider player pool here.
 */
export function LineupPitch({
  starters,
  bench,
  captainId,
  viceCaptainId,
  selectedId,
  targetIds,
  onPlayerClick,
  className,
}: LineupPitchProps) {
  const hasSelection = selectedId !== null;

  const card = (player: Player) => (
    <div key={player.id} className="w-[15.5%] max-w-[92px] min-w-0">
      <PlayerCard
        player={player}
        starting
        captain={captainId === player.id}
        vice={viceCaptainId === player.id}
        selected={selectedId === player.id}
        out={false}
        target={targetIds.has(player.id)}
        dimmed={hasSelection && selectedId !== player.id && !targetIds.has(player.id)}
        onClick={onPlayerClick}
      />
    </div>
  );

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
      <PitchSurface className="rounded-none border-0">
        <div className="flex flex-col gap-3 sm:gap-5">
          {ROWS.map((position) => {
            const inRow = starters.filter((player) => player.position === position);
            if (inRow.length === 0) return null;
            return (
              <div
                key={position}
                className="flex items-start justify-center gap-1 sm:gap-3"
                role="group"
                aria-label={`Starting ${position}`}
              >
                {inRow.map(card)}
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
          {bench.map((player) => (
            <div
              key={player.id}
              className="flex w-[15.5%] max-w-[92px] min-w-0 flex-col items-center"
            >
              <PlayerCard
                player={player}
                starting
                captain={false}
                vice={false}
                selected={selectedId === player.id}
                out={false}
                target={targetIds.has(player.id)}
                dimmed={hasSelection && selectedId !== player.id && !targetIds.has(player.id)}
                onClick={onPlayerClick}
              />
              <span className="mt-1 text-[10px] font-semibold text-muted-foreground">
                {player.position}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}