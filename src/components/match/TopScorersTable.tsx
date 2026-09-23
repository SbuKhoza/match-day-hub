import { useState } from "react";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, ErrorMessage, LoadingState } from "@/components/common/DataState";
import { LiveDataFooter } from "@/components/common/LiveDataFooter";
import { cn } from "@/lib/utils";
import { useTopScorers } from "@/hooks/useSportsData";

const STATS = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
] as const;

export function TopScorersTable() {
  const [stat, setStat] = useState<"goals" | "assists">("goals");
  const { rows, isLoading, isError, meta, refetch } = useTopScorers(stat);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {STATS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStat(item.key)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs font-medium",
              stat === item.key ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState label="Loading player statistics…" /> : null}
      {isError && rows.length === 0 ? (
        <ErrorMessage detail={meta.error} onRetry={() => void refetch()} />
      ) : null}
      {!isLoading && rows.length === 0 ? <EmptyMessage title="No statistics available." /> : null}

      {rows.length > 0 ? (
        <Card>
          <CardBody className="overflow-x-auto p-4">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">#</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Player</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Club</th>
                  <th scope="col" className="py-2 pr-2 text-right font-medium">Goals</th>
                  <th scope="col" className="py-2 pr-2 text-right font-medium">Assists</th>
                  <th scope="col" className="py-2 pr-2 text-right font-medium">Apps</th>
                  <th scope="col" className="py-2 text-right font-medium">Minutes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.playerSlug} className="border-t border-border">
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{row.rank}</td>
                    <td className="py-2.5 pr-3 font-medium">{row.playerName}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{row.teamName}</td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">{row.goals ?? "—"}</td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">{row.assists ?? "—"}</td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">{row.appearances ?? "—"}</td>
                    <td className="py-2.5 text-right tabular-nums">{row.minutes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ) : null}

      <LiveDataFooter meta={meta} />
    </div>
  );
}
