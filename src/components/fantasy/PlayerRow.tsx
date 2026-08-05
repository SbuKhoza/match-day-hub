import { Check, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { TeamBadge } from "@/components/common/TeamBadge";
import { cn } from "@/lib/utils";
import { getTeam } from "@/services/mockData";
import { formatRand } from "@/utils/format";
import type { Player } from "@/types/fantasy";

export function PlayerRow({
  player,
  selected = false,
  disabled = false,
  onToggle,
  trailing,
}: {
  player: Player;
  selected?: boolean;
  disabled?: boolean;
  onToggle?: (player: Player) => void;
  trailing?: ReactNode;
}) {
  const club = getTeam(player.clubId);
  const Icon = selected ? Minus : Plus;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border px-3 py-2.5",
        selected && "bg-secondary",
      )}
    >
      {club ? <TeamBadge team={club} size="sm" /> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{player.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {player.position} · {club?.shortName ?? player.clubId} · {player.totalPoints} pts
        </p>
      </div>
      <span className="text-sm font-semibold tabular-nums">{formatRand(player.price)}</span>
      {trailing}
      {onToggle ? (
        <button
          type="button"
          aria-label={selected ? `Remove ${player.name}` : `Add ${player.name}`}
          disabled={disabled && !selected}
          onClick={() => onToggle(player)}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-background disabled:opacity-40",
            selected && "bg-primary text-primary-foreground",
          )}
        >
          {selected ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  );
}
