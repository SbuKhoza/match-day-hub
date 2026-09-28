import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/common/Card";
import type { NormalizedScorer } from "@/services/sportscore/normalize";

/**
 * One-row leaderboard summary: [icon + label] [photo, name, club] [See all / value / label] [>].
 * Tapping the player opens their profile; tapping the right side opens /stats.
 * Pass `row={null}` for an "unavailable" state (e.g. clean sheets).
 */
export function StatLeaderRow({
  icon: Icon,
  label,
  row,
  value,
  valueLabel,
  unavailableText = "Not available yet",
}: {
  icon: LucideIcon;
  label: string;
  row: NormalizedScorer | null;
  value?: number | null | undefined;
  valueLabel: string;
  unavailableText?: string;
}) {
  return (
    <Card>
      <div className="flex items-stretch">
        <div className="flex w-[6rem] shrink-0 items-center gap-2 py-2.5 pl-3 sm:w-36">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold leading-tight">{label}</span>
        </div>

        {row ? (
          <Link
            to="/players/provider/$slug"
            params={{ slug: row.playerSlug }}
            className="flex min-w-0 flex-1 items-center gap-2 px-1"
          >
            <span className="h-12 w-12 shrink-0 self-end overflow-hidden rounded-full bg-secondary sm:h-14 sm:w-14">
              {row.photo ? (
                <img src={row.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{row.playerName}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                {row.teamLogo ? (
                  <img
                    src={row.teamLogo}
                    alt=""
                    loading="lazy"
                    className="h-4 w-4 shrink-0 object-contain"
                  />
                ) : null}
                <span className="truncate">{row.teamName}</span>
              </span>
            </span>
          </Link>
        ) : (
          <p className="flex min-w-0 flex-1 items-center px-1 text-[11px] text-muted-foreground">
            {unavailableText}
          </p>
        )}

        <Link
          to="/stats"
          className="flex shrink-0 items-center gap-1 py-2 pl-2 pr-2.5"
          aria-label={`See all ${label}`}
        >
          <span className="flex flex-col items-center leading-tight">
            <span className="text-[10px] text-muted-foreground">See all</span>
            {row ? (
              <>
                <span className="mt-0.5 text-base font-semibold tabular-nums">{value ?? "—"}</span>
                <span className="text-[10px] text-muted-foreground">{valueLabel}</span>
              </>
            ) : null}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}