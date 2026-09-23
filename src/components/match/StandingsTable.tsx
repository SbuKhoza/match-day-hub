import { Link } from "@tanstack/react-router";

import { TeamBadge } from "@/components/common/TeamBadge";
import { cn } from "@/lib/utils";
import type { NormalizedStandingRow } from "@/services/sportscore/normalize";

export function StandingsTable({
  rows,
  highlightSlug,
}: {
  rows: NormalizedStandingRow[];
  highlightSlug?: string | undefined;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">League table</caption>
        <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="py-2 pr-3 font-medium">#</th>
            <th scope="col" className="py-2 pr-3 font-medium">Club</th>
            <th scope="col" className="py-2 pr-2 text-right font-medium">P</th>
            <th scope="col" className="py-2 pr-2 text-right font-medium">W</th>
            <th scope="col" className="py-2 pr-2 text-right font-medium">D</th>
            <th scope="col" className="py-2 pr-2 text-right font-medium">L</th>
            <th scope="col" className="py-2 pr-2 text-right font-medium">GF</th>
            <th scope="col" className="py-2 pr-2 text-right font-medium">GA</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">GD</th>
            <th scope="col" className="py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.team.slug}
              className={cn(
                "border-t border-border",
                row.team.slug === highlightSlug && "bg-secondary/60 font-semibold",
              )}
            >
              <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{row.position}</td>
              <td className="py-2.5 pr-3">
                <Link
                  to="/match-center/$teamId"
                  params={{ teamId: row.team.slug }}
                  className="flex items-center gap-2 hover:underline"
                >
                  <TeamBadge team={row.team} size="sm" className="h-7 w-7" />
                  <span className="truncate">{row.team.name}</span>
                </Link>
              </td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.played}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.won}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.drawn}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.lost}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.goalsFor}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.goalsAgainst}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{row.goalDifference}</td>
              <td className="py-2.5 text-right font-semibold tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
