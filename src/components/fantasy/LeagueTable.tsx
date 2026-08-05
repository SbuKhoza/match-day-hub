import { cn } from "@/lib/utils";
import { ordinal } from "@/utils/format";

export interface LeagueTableRow {
  uid: string;
  name: string;
  gameweekPoints: number;
  totalPoints: number;
  captain: string;
  transfers: number;
}

export function LeagueTable({ rows, currentUid }: { rows: LeagueTableRow[]; currentUid?: string | undefined }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="py-2 pr-3 font-medium">#</th>
            <th className="py-2 pr-3 font-medium">Team</th>
            <th className="py-2 pr-3 font-medium">Captain</th>
            <th className="py-2 pr-3 font-medium">Transfers</th>
            <th className="py-2 pr-3 text-right font-medium">GW</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.uid}
              className={cn("border-t border-border", row.uid === currentUid && "font-semibold")}
            >
              <td className="py-3 pr-3 text-muted-foreground">{ordinal(index + 1)}</td>
              <td className="py-3 pr-3">{row.name}</td>
              <td className="py-3 pr-3 text-muted-foreground">{row.captain}</td>
              <td className="py-3 pr-3 tabular-nums text-muted-foreground">{row.transfers}</td>
              <td className="py-3 pr-3 text-right tabular-nums">{row.gameweekPoints}</td>
              <td className="py-3 text-right tabular-nums">{row.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
