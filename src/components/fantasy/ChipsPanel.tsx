import { Check, Star, Users } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
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

/** Double Captain and Bench Boost. Each can be used once in each half of the season. */
export function ChipsPanel({ lineups, chips, gameweek, half, onToggle, disabled }: ChipsPanelProps) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Chips</h2>
          <p className="text-xs text-muted-foreground">
            Gameweek {gameweek} · {half === 1 ? "first" : "second"} half. Each chip can be used once
            per half, twice a season.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(CHIP_LABELS) as ChipKey[]).map((chip) => {
            const status = chipStatus(lineups, chip, gameweek, half, chips[chip]);
            const remaining = chipsRemaining(lineups, chip);
            const Icon = ICONS[chip];
            const blocked = disabled || (!status.active && !status.available);
            return (
              <div
                key={chip}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3",
                  status.active ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4" /> {CHIP_LABELS[chip]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    1st half {remaining[1] ? "available" : "used"} · 2nd half{" "}
                    {remaining[2] ? "available" : "used"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{DESCRIPTIONS[chip]}</p>
                <button
                  type="button"
                  disabled={blocked}
                  aria-pressed={status.active}
                  onClick={() => onToggle(chip)}
                  className={cn(
                    "mt-auto inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all disabled:opacity-50",
                    status.active
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 hover:bg-white/15",
                  )}
                >
                  {status.active ? (
                    <>
                      <Check className="h-4 w-4" /> Active for GW {gameweek}
                    </>
                  ) : (
                    `Activate for GW ${gameweek}`
                  )}
                </button>
                {status.reason && !status.active ? (
                  <p className="text-[11px] text-muted-foreground">{status.reason}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}