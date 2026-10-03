import { Check, ChevronDown, Star, Users } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  BENCH_BOOST_BONUS,
  CHIP_LABELS,
  DOUBLE_CAPTAIN_MULTIPLIER,
  chipsRemaining,
  chipStatus,
  type ChipKey,
} from "@/services/chipService";
import type { FantasyTeam, GameweekChips, SeasonHalf } from "@/types/fantasy";

const DESCRIPTIONS: Record<ChipKey, string> = {
  doubleCaptain: `Your captain's points are doubled again this gameweek (x${DOUBLE_CAPTAIN_MULTIPLIER} instead of x2).`,
  benchBoost: `Your substitutes' points count this gameweek. Anyone who scores 1+ gets ${BENCH_BOOST_BONUS} extra points; players who didn't play stay on 0.`,
};

const HOW_TO: Record<ChipKey, string[]> = {
  doubleCaptain: [
    "Choose your captain on the pitch: tap a starter, then tap Captain.",
    "Press Activate below.",
    "Press Save line-up to lock the chip in.",
  ],
  benchBoost: [
    "Set your starting XI and your substitutes as you want them.",
    "Press Activate below.",
    "Press Save line-up to lock the chip in.",
  ],
};

const ICONS = { doubleCaptain: Star, benchBoost: Users } as const;

export interface ChipsPanelProps {
  lineups: FantasyTeam["lineups"];
  chips: GameweekChips;
  /** Gameweek the chips apply to. */
  gameweek: number;
  half: SeasonHalf;
  onToggle: (chip: ChipKey) => void;
  disabled?: boolean;
}

/**
 * Double Captain and Bench Boost, shown as two small buttons. Tapping one opens its instructions;
 * the chip is only switched on from the Activate button inside that panel.
 * Each chip can be used once in each half of the season.
 */
export function ChipsPanel({ lineups, chips, gameweek, half, onToggle, disabled }: ChipsPanelProps) {
  const [open, setOpen] = useState<ChipKey | null>(null);
  const keys = Object.keys(CHIP_LABELS) as ChipKey[];

  const openStatus = open ? chipStatus(lineups, open, gameweek, half, chips[open]) : null;
  const OpenIcon = open ? ICONS[open] : null;
  const blocked = Boolean(disabled || (openStatus && !openStatus.active && !openStatus.available));
  const remaining = open ? chipsRemaining(lineups, open) : null;

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Chips</p>
      <div className="grid grid-cols-2 gap-2">
        {keys.map((chip) => {
          const Icon = ICONS[chip];
          const active = chips[chip];
          const isOpen = open === chip;
          return (
            <button
              key={chip}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : chip)}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors",
                active
                  ? "bg-gold/15 text-gold ring-gold/40"
                  : "bg-white/[0.05] ring-white/10 hover:bg-white/10",
                isOpen && !active && "ring-primary/60",
              )}
            >
              {active ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{CHIP_LABELS[chip]}</span>
                <span
                  className={cn(
                    "block text-[10px]",
                    active ? "text-gold/80" : "text-muted-foreground",
                  )}
                >
                  {active ? "Active" : isOpen ? "Hide info" : "Tap for info"}
                </span>
              </span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 shrink-0 opacity-60 transition-transform", isOpen && "rotate-180")}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {open && openStatus && OpenIcon ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <OpenIcon className="h-4 w-4" /> {CHIP_LABELS[open]}
            </p>
            <p className="text-right text-[11px] text-muted-foreground">
              GW {gameweek} · {half === 1 ? "first" : "second"} half
            </p>
          </div>

          <p className="text-xs text-muted-foreground">{DESCRIPTIONS[open]}</p>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              How to use it
            </p>
            <ol className="list-inside list-decimal space-y-0.5 text-xs">
              {HOW_TO[open].map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Once per half · 1st half {remaining?.[1] ? "available" : "used"} · 2nd half{" "}
            {remaining?.[2] ? "available" : "used"}
          </p>

          <button
            type="button"
            disabled={blocked}
            aria-pressed={openStatus.active}
            onClick={() => onToggle(open)}
            className={cn(
              "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all disabled:opacity-50",
              openStatus.active
                ? "bg-white/10 hover:bg-white/15"
                : "bg-primary text-primary-foreground hover:brightness-110",
            )}
          >
            {openStatus.active ? (
              <>
                <Check className="h-4 w-4" /> Active for GW {gameweek} · tap to remove
              </>
            ) : (
              `Activate for GW ${gameweek}`
            )}
          </button>
          {openStatus.reason && !openStatus.active ? (
            <p className="text-[11px] text-muted-foreground">{openStatus.reason}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}