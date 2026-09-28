import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { formatRand } from "@/utils/format";
import { SQUAD_RULES, type Player, type PlayerPosition } from "@/types/fantasy";

const ROWS: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];

/** Deterministic hue per club so each club gets a consistent shirt colour. */
function clubHue(clubId: string): number {
  let hash = 0;
  for (let i = 0; i < clubId.length; i += 1) hash = (hash * 31 + clubId.charCodeAt(i)) % 360;
  return hash;
}

function Shirt({ player }: { player: Player }) {
  const hue = clubHue(player.clubId);
  const isKeeper = player.position === "GK";
  const fill = isKeeper ? `oklch(0.72 0.17 ${(hue + 120) % 360})` : `oklch(0.52 0.19 ${hue})`;
  const trim = `oklch(0.95 0.02 ${hue})`;

  return (
    <svg viewBox="0 0 40 36" className="h-8 w-9 drop-shadow-md sm:h-11 sm:w-12" aria-hidden="true">
      <path
        d="M13 2 L4 7 L1 16 L8 19 L10 15 L10 34 L30 34 L30 15 L32 19 L39 16 L36 7 L27 2 C25 5 15 5 13 2 Z"
        fill={fill}
        stroke="oklch(0 0 0 / 25%)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M13 2 C15 5 25 5 27 2" fill="none" stroke={trim} strokeWidth="1.6" />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="white"
        style={{ paintOrder: "stroke", stroke: "oklch(0 0 0 / 35%)", strokeWidth: 0.6 }}
      >
        {(player.clubShort ?? player.clubName).slice(0, 3).toUpperCase()}
      </text>
    </svg>
  );
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
}

export interface PitchProps {
  squad: Player[];
  /** Ids in the starting XI. When omitted, everyone is treated as a starter. */
  starters?: string[];
  captainId?: string | null;
  /** Highlighted (e.g. picked to act on). */
  selectedId?: string | null;
  /** Marked as leaving the squad (transfers). */
  outId?: string | null;
  onPlayerClick?: ((player: Player) => void) | undefined;
  /** Called when an empty slot is pressed. Omit to render slots as static placeholders. */
  onEmptyClick?: ((position: PlayerPosition) => void) | undefined;
  className?: string;
}

export function PlayerCard({
  player,
  starting,
  captain,
  vice = false,
  selected,
  out,
  target = false,
  dimmed = false,
  onClick,
}: {
  player: Player;
  starting: boolean;
  captain: boolean;
  vice?: boolean;
  selected: boolean;
  out: boolean;
  /** Valid swap partner for the currently selected player. */
  target?: boolean;
  /** Not a valid swap partner while another player is selected. */
  dimmed?: boolean;
  onClick?: ((player: Player) => void) | undefined;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(player)}
      aria-pressed={selected || out}
      aria-label={`${player.name}, ${player.position}, ${player.clubName}, ${formatRand(player.price)}`}
      title={player.name}
      disabled={!onClick}
      className={cn(
        "group relative flex w-full min-w-0 flex-col items-center rounded-md pt-1 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-white enabled:hover:-translate-y-0.5",
        !starting && "opacity-75",
        dimmed && "opacity-40",
        target && "bg-white/20 ring-2 ring-yellow-300 animate-pulse",
        (selected || out) && "bg-white/15 ring-2 ring-white",
        out && "ring-[oklch(0.7_0.2_25)]",
      )}
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
        {out ? (
          <span className="absolute -left-1.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[oklch(0.6_0.22_25)] text-white shadow">
            <Minus className="h-3 w-3" />
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block w-full truncate bg-white px-0.5 text-center text-[10px] font-semibold leading-4 text-neutral-900 sm:text-xs sm:leading-5">
        {shortName(player.name)}
      </span>
      <span className="block w-full truncate bg-neutral-900/85 px-0.5 text-center text-[9px] leading-4 text-white sm:text-[11px] sm:leading-5">
        {starting ? formatRand(player.price) : `SUB · ${formatRand(player.price)}`}
      </span>
    </button>
  );
}

function EmptySlot({
  position,
  onClick,
}: {
  position: PlayerPosition;
  onClick?: ((position: PlayerPosition) => void) | undefined;
}) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={() => onClick?.(position)}
      aria-label={`Add ${position}`}
      className="flex w-full min-w-0 flex-col items-center pt-1 outline-none focus-visible:ring-2 focus-visible:ring-white enabled:hover:opacity-100 sm:pt-2"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-white/10 text-white sm:h-11 sm:w-11">
        <Plus className="h-4 w-4" />
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/85 sm:text-xs">
        {position}
      </span>
    </button>
  );
}

/** Grass, stripes and markings. Children are laid over the pitch. */
export function PitchSurface({
  className,
  children,
}: {
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-lg border border-white/20 px-2 py-4 sm:px-6 sm:py-6",
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, oklch(0.6 0.16 145) 0 12.5%, oklch(0.55 0.15 145) 12.5% 25%)",
      }}
    >
      {/* pitch markings */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-2 border-2 border-white/60 sm:inset-3" />
        <div className="absolute left-1/2 top-2 h-3 w-[22%] -translate-x-1/2 border-2 border-t-0 border-white/60 bg-white/10 sm:top-3" />
        <div className="absolute left-1/2 top-2 h-[17%] w-[62%] -translate-x-1/2 border-2 border-t-0 border-white/60 sm:top-3" />
        <div className="absolute left-1/2 top-2 h-[7%] w-[32%] -translate-x-1/2 border-2 border-t-0 border-white/60 sm:top-3" />
        <div className="absolute left-0 right-0 top-[76%] border-t-2 border-white/60" />
        <div className="absolute bottom-2 left-1/2 aspect-square w-[28%] -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white/60 sm:bottom-3" />
      </div>

      {children}
    </div>
  );
}

/**
 * A football pitch showing the whole squad row by row (GK at the top, forwards at the bottom).
 * Unfilled slots render as "+" placeholders per position.
 */
export function Pitch({
  squad,
  starters,
  captainId = null,
  selectedId = null,
  outId = null,
  onPlayerClick,
  onEmptyClick,
  className,
}: PitchProps) {
  return (
    <PitchSurface className={className}>
      <div className="flex flex-col gap-3 sm:gap-5">
        {ROWS.map((position) => {
          const inRow = squad.filter((player) => player.position === position);
          const slots = SQUAD_RULES.positions[position];
          const empties = Math.max(0, slots - inRow.length);
          return (
            <div
              key={position}
              className="flex items-start justify-center gap-1 sm:gap-3"
              role="group"
              aria-label={position}
            >
              {inRow.map((player) => (
                <div key={player.id} className="w-[15.5%] max-w-[92px] min-w-0">
                  <PlayerCard
                    player={player}
                    starting={!starters || starters.includes(player.id)}
                    captain={captainId === player.id}
                    selected={selectedId === player.id}
                    out={outId === player.id}
                    onClick={onPlayerClick}
                  />
                </div>
              ))}
              {Array.from({ length: empties }, (_, index) => (
                <div key={`empty-${position}-${index}`} className="w-[15.5%] max-w-[92px] min-w-0">
                  <EmptySlot position={position} onClick={onEmptyClick} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </PitchSurface>
  );
}