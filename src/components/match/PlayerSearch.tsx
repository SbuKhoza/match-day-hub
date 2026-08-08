import { Search } from "lucide-react";
import { useMemo, useRef, useState, useId } from "react";

import { useLive } from "@/hooks/useLive";
import { cn } from "@/lib/utils";
import { getTeam } from "@/services/mockData";
import { PLAYERS } from "@/services/playerPool";

/** Type-ahead over every player in the league; selecting one opens their live stats. */
export function PlayerSearch({ onSelectPlayer }: { onSelectPlayer: (playerId: string) => void }) {
  const { livePoints } = useLive();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return PLAYERS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const pointsFor = (playerId: string) =>
    livePoints.find((entry) => entry.playerId === playerId)?.points ?? 0;

  const choose = (playerId: string) => {
    onSelectPlayer(playerId);
    setQuery("");
    setActive(0);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search for a player
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          id={`${listId}-input`}
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            results[active] ? `${listId}-opt-${results[active].id}` : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (results.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => (i + 1) % results.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => (i - 1 + results.length) % results.length);
            } else if (event.key === "Enter") {
              event.preventDefault();
              const player = results[active];
              if (player) choose(player.id);
            } else if (event.key === "Escape") {
              setQuery("");
            }
          }}
          placeholder="Search any player…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Player search results"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-background shadow-lg"
        >
          {results.map((player, index) => (
            <li
              key={player.id}
              id={`${listId}-opt-${player.id}`}
              role="option"
              aria-selected={index === active}
            >
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(player.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                  index === active ? "bg-secondary" : "",
                )}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {player.position} · {getTeam(player.clubId)?.shortName ?? ""}
                </span>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums">
                  {pointsFor(player.id)} pts
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
