import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { usePlayers, useTeams } from "@/hooks/useMasterData";
import { normalizeName, type PlayerPosition } from "@/types/master";
import { formatRand } from "@/utils/format";

const POSITIONS: (PlayerPosition | "All")[] = ["All", "GK", "DEF", "MID", "FWD"];

export function PlayersScreen() {
  const players = usePlayers();
  const teams = useTeams();
  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState("All");
  const [position, setPosition] = useState<PlayerPosition | "All">("All");

  const filtered = useMemo(() => {
    const term = normalizeName(search);
    return (players.data ?? []).filter((player) => {
      if (teamId !== "All" && player.teamId !== teamId) return false;
      if (position !== "All" && player.position !== position) return false;
      if (term && !player.playerNameNormalized.includes(term)) return false;
      return true;
    });
  }, [players.data, search, teamId, position]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Players"
        subtitle="The imported PSL player database used for fantasy selection."
      />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border p-3">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor="player-search" className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Search
          </label>
          <input
            id="player-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search players"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="player-team" className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Club
          </label>
          <select
            id="player-team"
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="All">All clubs</option>
            {(teams.data ?? []).map((team) => (
              <option key={team.teamId} value={team.teamId}>
                {team.teamName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="player-position" className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Position
          </label>
          <select
            id="player-position"
            value={position}
            onChange={(event) => setPosition(event.target.value as PlayerPosition | "All")}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {POSITIONS.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All positions" : item}
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground" role="status">
          {filtered.length} player{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {players.isLoading ? <LoadingState label="Loading players…" /> : null}
      {players.isError ? (
        <EmptyMessage title="Player data could not be loaded." description="Please try again shortly." />
      ) : null}
      {!players.isLoading && (players.data ?? []).length === 0 ? (
        <EmptyMessage
          title="No players have been imported yet."
          description="An administrator needs to import the current PSL player file before selection opens."
        />
      ) : null}
      {!players.isLoading && (players.data ?? []).length > 0 && filtered.length === 0 ? (
        <EmptyMessage title="No players match these filters." />
      ) : null}

      {filtered.length > 0 ? (
        <Card>
          <CardBody className="overflow-x-auto p-4">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">Player</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Club</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Position</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Price</th>
                  <th scope="col" className="py-2 text-right font-medium">Fantasy points</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map((player) => (
                  <tr key={player.playerId} className="border-t border-border">
                    <td className="py-2.5 pr-3 font-medium">
                      <Link
                        to="/players/$playerId"
                        params={{ playerId: player.playerId }}
                        className="hover:underline"
                      >
                        {player.playerName}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{player.teamName}</td>
                    <td className="py-2.5 pr-3">{player.position ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {player.fantasyPrice === null ? "—" : formatRand(player.fantasyPrice)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{player.fantasyPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
