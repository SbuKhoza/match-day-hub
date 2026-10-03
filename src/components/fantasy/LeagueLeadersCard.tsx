import { Link } from "@tanstack/react-router";
import { ChevronRight, Crown, Footprints, Hand } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { NormalizedScorer } from "@/services/sportscore/normalize";

function LeaderRow({
  icon: Icon,
  label,
  row,
  value,
  valueLabel,
  unavailableText,
}: {
  icon: LucideIcon;
  label: string;
  row: NormalizedScorer | null;
  value?: number | null | undefined;
  valueLabel: string;
  unavailableText: string;
}) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {row ? (
          <span className="block truncate text-sm font-semibold">{row.playerName}</span>
        ) : (
          <span className="block text-xs text-muted-foreground">{unavailableText}</span>
        )}
      </span>
      {row ? (
        <>
          <span className="shrink-0 text-right">
            <span className="block text-base font-bold tabular-nums leading-tight">{value ?? "—"}</span>
            <span className="block text-[10px] text-muted-foreground">{valueLabel}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </>
      ) : null}
    </>
  );

  const className = "flex items-center gap-3 px-4 py-2.5";
  return row ? (
    <Link to="/players/provider/$slug" params={{ slug: row.playerSlug }} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/** One compact module replacing the separate Top Scorer / Top Assists / Clean Sheets cards. */
export function LeagueLeadersCard({
  topScorer,
  topAssist,
}: {
  topScorer: NormalizedScorer | null;
  topAssist: NormalizedScorer | null;
}) {
  return (
    <div className="home-card divide-y divide-white/5 overflow-hidden">
      <LeaderRow
        icon={Crown}
        label="Top scorer"
        row={topScorer}
        value={topScorer?.goals}
        valueLabel="Goals"
        unavailableText="No statistics available"
      />
      <LeaderRow
        icon={Footprints}
        label="Top assists"
        row={topAssist}
        value={topAssist?.assists}
        valueLabel="Assists"
        unavailableText="No statistics available"
      />
      <LeaderRow
        icon={Hand}
        label="Clean sheets"
        row={null}
        valueLabel="Clean sheets"
        unavailableText="Not published by provider"
      />
    </div>
  );
}