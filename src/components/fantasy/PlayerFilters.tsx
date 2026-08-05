import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { TEAMS } from "@/services/mockData";
import type { PlayerPosition } from "@/types/fantasy";

export interface PlayerFilterState {
  search: string;
  position: PlayerPosition | "ALL";
  clubId: string | "ALL";
  maxPrice: number;
}

const POSITIONS: (PlayerPosition | "ALL")[] = ["ALL", "GK", "DEF", "MID", "FWD"];

export function PlayerFilters({
  value,
  onChange,
  priceCeiling,
}: {
  value: PlayerFilterState;
  onChange: (next: PlayerFilterState) => void;
  priceCeiling: number;
}) {
  const set = (patch: Partial<PlayerFilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={value.search}
          maxLength={40}
          onChange={(event) => set({ search: event.target.value })}
          placeholder="Search player"
          className="h-11 w-full rounded-full border border-border bg-transparent pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {POSITIONS.map((position) => (
          <button
            key={position}
            type="button"
            onClick={() => set({ position })}
            className={cn(
              "rounded-full border border-border px-3.5 py-1.5 text-xs font-medium transition-colors",
              value.position === position ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            )}
          >
            {position}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={value.clubId}
          onChange={(event) => set({ clubId: event.target.value })}
          className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="ALL">All clubs</option>
          {TEAMS.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-3 rounded-full border border-border px-4 text-sm">
          <span className="shrink-0 text-muted-foreground">Max</span>
          <input
            type="range"
            min={3_000_000}
            max={priceCeiling}
            step={500_000}
            value={value.maxPrice}
            onChange={(event) => set({ maxPrice: Number(event.target.value) })}
            className="h-11 w-full accent-current"
          />
          <span className="shrink-0 font-medium tabular-nums">
            R{(value.maxPrice / 1_000_000).toFixed(1)}m
          </span>
        </label>
      </div>
    </div>
  );
}
