import { Link } from "@tanstack/react-router";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { usePlayers } from "@/hooks/useMasterData";
import type { MasterPlayer, PlayerPosition } from "@/types/master";

const GROUPS: { position: PlayerPosition | null; label: string }[] = [
  { position: "GK", label: "Goalkeepers" },
  { position: "DEF", label: "Defenders" },
  { position: "MID", label: "Midfielders" },
  { position: "FWD", label: "Forwards" },
  { position: null, label: "Position not recorded" },
];

function SquadRow({ player }: { player: MasterPlayer }) {
  return (
    <li className="flex items-center gap-3 border-t border-border py-2 text-sm first:border-t-0">
      <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
        {player.shirtNumber ?? "—"}
      </span>
      <Link
        to="/players/$playerId"
        params={{ playerId: player.playerId }}
        className="min-w-0 flex-1 truncate font-medium hover:underline"
      >
        {player.playerName}
      </Link>
      <span className="shrink-0 text-xs text-muted-foreground">{player.nationality ?? "—"}</span>
    </li>
  );
}

/** Imported squad for one club, grouped by position. Empty until players are imported. */
export function TeamSquad({ teamId }: { teamId: string | null }) {
  const { data, isLoading } = usePlayers(teamId ? { teamId } : {});

  if (!teamId) {
    return (
      <EmptyMessage
        title="This club has not been imported yet."
        description="Squad lists appear once an administrator imports the club and player files."
      />
    );
  }
  if (isLoading) return <LoadingState label="Loading squad…" />;

  const players = data ?? [];
  if (players.length === 0) {
    return <EmptyMessage title="No players have been imported for this club yet." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {GROUPS.map((group) => {
        const members = players.filter((player) => player.position === group.position);
        if (members.length === 0) return null;
        return (
          <Card key={group.label}>
            <CardBody className="p-4">
              <h3 className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                {group.label}
              </h3>
              <ul>
                {members.map((player) => (
                  <SquadRow key={player.playerId} player={player} />
                ))}
              </ul>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
