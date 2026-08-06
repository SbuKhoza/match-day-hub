import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { TableRow } from "@/services/leagueData";

export function StandingsTable({
  rows,
  highlightTeamId,
}: {
  rows: TableRow[];
  highlightTeamId?: string | undefined;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="py-2 pr-3 font-medium">#</th>
            <th className="py-2 pr-3 font-medium">Club</th>
            <th className="py-2 pr-2 text-right font-medium">P</th>
            <th className="py-2 pr-2 text-right font-medium">W</th>
            <th className="py-2 pr-2 text-right font-medium">D</th>
            <th className="py-2 pr-2 text-right font-medium">L</th>
            <th className="py-2 pr-2 text-right font-medium">GF</th>
            <th className="py-2 pr-2 text-right font-medium">GA</th>
            <th className="py-2 pr-3 text-right font-medium">GD</th>
            <th className="py-2 pr-3 font-medium">Form</th>
            <th className="py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.teamId}
              className={cn(
                "border-t border-border",
                row.teamId === highlightTeamId && "bg-secondary/60 font-semibold",
              )}
            >
              <td className="py-2.5 pr-3 text-muted-foreground tabular-nums">{index + 1}</td>
              <td className="py-2.5 pr-3">
                <Link
                  to="/match-center/$teamId"
                  params={{ teamId: row.teamId }}
                  className="hover:underline"
                >
                  {row.name}
                </Link>
              </td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.played}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.won}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.drawn}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.lost}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.goalsFor}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{row.goalsAgainst}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{row.goalDifference}</td>
              <td className="py-2.5 pr-3">
                <span className="flex gap-1">
                  {row.form.map((result, i) => (
                    <span
                      key={`${row.teamId}-${i}`}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold",
                        result === "W" && "bg-foreground text-background",
                        result === "D" && "bg-secondary text-secondary-foreground",
                        result === "L" && "border border-border text-muted-foreground",
                      )}
                    >
                      {result}
                    </span>
                  ))}
                </span>
              </td>
              <td className="py-2.5 text-right font-semibold tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
