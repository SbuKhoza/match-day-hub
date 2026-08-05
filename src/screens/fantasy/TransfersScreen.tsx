import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { PlayerFilters, type PlayerFilterState } from "@/components/fantasy/PlayerFilters";
import { PlayerRow } from "@/components/fantasy/PlayerRow";
import { StatTile } from "@/components/fantasy/StatTile";
import { useFantasyDb, useFantasyTeam, useGameweek, usePlayers, useTransfers } from "@/hooks/useFantasy";
import { recordTransfer, saveFantasyTeam, validateSquad } from "@/services/fantasyService";
import { getPlayer } from "@/services/playerPool";
import { SQUAD_RULES, type Player } from "@/types/fantasy";
import { formatRand } from "@/utils/format";

export function TransfersScreen() {
  const { db, uid } = useFantasyDb();
  const queryClient = useQueryClient();
  const { data: team } = useFantasyTeam();
  const { data: players = [] } = usePlayers();
  const { data: transfers = [] } = useTransfers();
  const { data: gameweek } = useGameweek();

  const [outId, setOutId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlayerFilterState>({
    search: "",
    position: "ALL",
    clubId: "ALL",
    maxPrice: 15_000_000,
  });

  const squad = (team?.squad ?? []).map(getPlayer).filter(Boolean) as Player[];
  const outPlayer = outId ? getPlayer(outId) : undefined;
  const spent = squad.reduce((sum, player) => sum + player.price, 0);
  const budgetLeft = SQUAD_RULES.budget - spent + (outPlayer?.price ?? 0);

  const candidates = useMemo(
    () =>
      players
        .filter((player) => !team?.squad.includes(player.id))
        .filter((player) => !outPlayer || player.position === outPlayer.position)
        .filter((player) => filters.position === "ALL" || player.position === filters.position)
        .filter((player) => filters.clubId === "ALL" || player.clubId === filters.clubId)
        .filter((player) => player.price <= Math.min(filters.maxPrice, budgetLeft))
        .filter((player) => player.name.toLowerCase().includes(filters.search.trim().toLowerCase()))
        .slice(0, 40),
    [players, team, outPlayer, filters, budgetLeft],
  );

  const makeTransfer = useMutation({
    mutationFn: async (incoming: Player) => {
      if (!db || !uid || !team || !outId) throw new Error("Select a player to transfer out first.");
      const nextSquad = team.squad.map((id) => (id === outId ? incoming.id : id));
      const nextStarters = team.starters.map((id) => (id === outId ? incoming.id : id));
      const check = validateSquad(nextSquad.map(getPlayer).filter(Boolean) as Player[], nextStarters);
      if (!check.valid) throw new Error(check.errors[0]!);
      await saveFantasyTeam(db, uid, {
        name: team.name,
        squad: nextSquad,
        starters: nextStarters,
        captainId: team.captainId === outId ? incoming.id : team.captainId,
        viceCaptainId: team.viceCaptainId === outId ? incoming.id : team.viceCaptainId,
      });
      await recordTransfer(db, {
        uid,
        gameweek: gameweek?.number ?? 0,
        outPlayerId: outId,
        inPlayerId: incoming.id,
      });
    },
    onSuccess: async () => {
      setOutId(null);
      await queryClient.invalidateQueries({ queryKey: ["fantasy"] });
    },
  });

  if (!team) {
    return (
      <div className="space-y-6">
        <PageHeader title="Transfers" subtitle="Swap players in and out of your squad." />
        <EmptyState
          icon={ArrowLeftRight}
          title="Build a team first"
          description="Once your 17-player squad is saved you can start making transfers here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transfers" subtitle={`Gameweek ${gameweek?.number ?? "—"} · like-for-like positions.`} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Budget available" value={formatRand(budgetLeft)} />
        <StatTile label="Transfers made" value={String(transfers.length)} />
        <StatTile label="Transferring out" value={outPlayer?.name ?? "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-semibold">Your squad</h2>
            <div className="space-y-2">
              {squad.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  selected={outId === player.id}
                  onToggle={() => setOutId((prev) => (prev === player.id ? null : player.id))}
                />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold">Transfer in</h2>
            {outPlayer ? (
              <>
                <PlayerFilters value={filters} onChange={setFilters} priceCeiling={15_000_000} />
                <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                  {candidates.map((player) => (
                    <div key={player.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <PlayerRow player={player} />
                      </div>
                      <Button size="sm" disabled={makeTransfer.isPending} onClick={() => makeTransfer.mutate(player)}>
                        Swap
                      </Button>
                    </div>
                  ))}
                  {candidates.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No affordable replacements match those filters.
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState
                icon={ArrowLeftRight}
                title="Pick someone to transfer out"
                description="Select a player from your squad to see valid replacements."
              />
            )}
            {makeTransfer.isError ? (
              <p className="text-xs text-destructive">{(makeTransfer.error as Error).message}</p>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">Transfer history</h2>
          {transfers.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {transfers.map((transfer) => (
                <li key={transfer.id} className="rounded-2xl border border-border px-3 py-2">
                  GW {transfer.gameweek}: {getPlayer(transfer.outPlayerId)?.name ?? transfer.outPlayerId} →{" "}
                  {getPlayer(transfer.inPlayerId)?.name ?? transfer.inPlayerId}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState icon={ArrowLeftRight} title="No transfers yet" description="Your swaps will be listed here." />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
