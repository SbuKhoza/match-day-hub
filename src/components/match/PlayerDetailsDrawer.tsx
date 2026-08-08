import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePlayerLive } from "@/hooks/useLive";
import { getTeam } from "@/services/mockData";
import { SCORING_RULES } from "@/services/scoringService";
import { formatRand } from "@/utils/format";

const ROW_LABEL: Record<string, string> = {
  appeared: "Appearance",
  goals: "Goals",
  assists: "Assists",
  cleanSheet: "Clean sheet",
  yellowCards: "Yellow cards",
  redCards: "Red cards",
};

const POINTS_PER = {
  appeared: 1,
  goals: 4,
  assists: 2,
  cleanSheet: 4,
  yellowCards: -1,
  redCards: -2,
} as const;

export function PlayerDetailsDrawer({
  playerId,
  onClose,
}: {
  playerId: string | null;
  onClose: () => void;
}) {
  const detail = usePlayerLive(playerId);
  const player = detail?.player;

  return (
    <Sheet open={Boolean(playerId)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
        aria-label={player ? `${player.name} live stats and fantasy impact` : "Player details"}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement)
            .querySelector<HTMLElement>("[data-drawer-focus]")
            ?.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{player?.name ?? "Player"}</SheetTitle>
          <SheetDescription>
            {player
              ? `Live per-match stats and fantasy points impact for ${player.name}. Press Escape to close.`
              : "Live per-match stats and fantasy points impact."}
          </SheetDescription>
        </SheetHeader>

        {player ? (
          <div
            className="space-y-6 px-4 pb-8 focus:outline-none"
            tabIndex={-1}
            data-drawer-focus
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-foreground">
                {player.position}
              </span>
              <span>{getTeam(player.clubId)?.name}</span>
              <span>·</span>
              <span>{formatRand(player.price)}</span>
            </div>

            <div className="rounded-2xl border border-border p-4" role="status" aria-live="polite">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Gameweek fantasy points
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                <span className="sr-only">{player.name} has </span>
                {detail?.points?.points ?? 0}
                <span className="sr-only"> fantasy points this gameweek</span>
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Per-match stats</h3>
              {detail && detail.perMatch.length > 0 ? (
                detail.perMatch.map(({ match, stats, points }) =>
                  match ? (
                    <div key={match.id} className="space-y-2 rounded-2xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3 text-sm font-medium">
                        <span className="truncate">
                          {match.home.shortName} {match.homeScore ?? 0}–{match.awayScore ?? 0}{" "}
                          {match.away.shortName}
                        </span>
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums">
                          {points} pts
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {(Object.keys(POINTS_PER) as (keyof typeof POINTS_PER)[])
                          .filter((key) =>
                            typeof stats[key] === "boolean" ? stats[key] : Number(stats[key]) > 0,
                          )
                          .map((key) => {
                            const count = typeof stats[key] === "boolean" ? 1 : Number(stats[key]);
                            const value = count * POINTS_PER[key];
                            return (
                              <li key={key} className="flex items-center justify-between">
                                <span>
                                  {ROW_LABEL[key]}
                                  {count > 1 ? ` ×${count}` : ""}
                                </span>
                                <span className="tabular-nums text-foreground">
                                  {value > 0 ? `+${value}` : value}
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  ) : null,
                )
              ) : (
                <p className="text-sm text-muted-foreground">No live match data yet.</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Scoring rules</h3>
              <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                {SCORING_RULES.map((rule) => (
                  <li key={rule.key} className="flex justify-between gap-2">
                    <span>{rule.label}</span>
                    <span className="tabular-nums text-foreground">
                      {rule.points > 0 ? `+${rule.points}` : rule.points}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
