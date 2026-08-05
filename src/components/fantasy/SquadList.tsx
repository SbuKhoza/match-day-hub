import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { getTeam } from "@/services/mockData";
import { formatRand } from "@/utils/format";
import type { Player, PlayerPosition } from "@/types/fantasy";

const ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];

export function SquadList({
  squad,
  starters,
  captainId,
  onToggleStarter,
  onSetCaptain,
  onRemove,
}: {
  squad: Player[];
  starters: string[];
  captainId: string | null;
  onToggleStarter?: (playerId: string) => void;
  onSetCaptain?: (playerId: string) => void;
  onRemove?: (playerId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {ORDER.map((position) => {
        const group = squad.filter((player) => player.position === position);
        if (group.length === 0) return null;
        return (
          <div key={position}>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{position}</p>
            <div className="space-y-2">
              {group.map((player) => {
                const starting = starters.includes(player.id);
                return (
                  <div
                    key={player.id}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5",
                      starting ? "bg-secondary" : "opacity-80",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{player.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getTeam(player.clubId)?.shortName} · {formatRand(player.price)}
                      </p>
                    </div>
                    {onSetCaptain ? (
                      <button
                        type="button"
                        aria-label={`Make ${player.name} captain`}
                        onClick={() => onSetCaptain(player.id)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border border-border",
                          captainId === player.id && "bg-primary text-primary-foreground",
                        )}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    ) : null}
                    {onToggleStarter ? (
                      <button
                        type="button"
                        onClick={() => onToggleStarter(player.id)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-background"
                      >
                        {starting ? "Bench" : "Start"}
                      </button>
                    ) : null}
                    {onRemove ? (
                      <button
                        type="button"
                        onClick={() => onRemove(player.id)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-background"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
