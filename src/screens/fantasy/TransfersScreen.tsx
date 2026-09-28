import { useFantasySettings } from "@/hooks/useAdmin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { Pitch } from "@/components/fantasy/Pitch";
import { PlayerFilters, type PlayerFilterState } from "@/components/fantasy/PlayerFilters";
import { PlayerRow } from "@/components/fantasy/PlayerRow";
import { StatTile } from "@/components/fantasy/StatTile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useFantasyDb,
  useFantasyTeam,
  useGameweek,
  usePlayers,
  useTransfers,
} from "@/hooks/useFantasy";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { recordTransfer, saveFantasyTeam, validateSquad } from "@/services/fantasyService";
import { SQUAD_RULES, type Player } from "@/types/fantasy";
import { formatRand } from "@/utils/format";

const PRICE_CEILING = 30_000_000;

export function TransfersScreen() {
  const { db, uid } = useFantasyDb();
  const queryClient = useQueryClient();
  const { data: team } = useFantasyTeam();
  const { data: players, byId, clubs } = usePlayers();
  const { data: transfers = [] } = useTransfers();
  const { data: gameweek } = useGameweek();

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [outId, setOutId] = useState<string | null>(null);
  const [poolOpen, setPoolOpen] = useState(false);
  const [filters, setFilters] = useState<PlayerFilterState>({
    search: "",
    position: "ALL",
    clubId: "ALL",
    maxPrice: PRICE_CEILING,
  });

  const resolve = (id: string) => byId.get(id);
  const squad = (team?.squad ?? []).map(resolve).filter(Boolean) as Player[];
  const outPlayer = outId ? byId.get(outId) : undefined;
  const spent = squad.reduce((sum, player) => sum + player.price, 0);
  const { budget } = useFantasySettings();
  const budgetLeft = budget - spent + (outPlayer?.price ?? 0);

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
      const nextPlayers = nextSquad.map(resolve).filter(Boolean) as Player[];
      const check = validateSquad(nextPlayers, nextStarters, budget);
      if (!check.valid) throw new Error(check.errors[0]!);
      await saveFantasyTeam(
        db,
        uid,
        {
          name: team.name,
          squad: nextSquad,
          starters: nextStarters,
          captainId: team.captainId === outId ? incoming.id : team.captainId,
          viceCaptainId: team.viceCaptainId === outId ? incoming.id : team.viceCaptainId,
        },
        nextPlayers,
        gameweek?.number ?? 0,
      );
      await recordTransfer(db, {
        uid,
        gameweek: gameweek?.number ?? 0,
        outPlayerId: outId,
        inPlayerId: incoming.id,
      });
    },
    onSuccess: async () => {
      setOutId(null);
      setPoolOpen(false);
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

  const replacements = outPlayer ? (
    <>
      <PlayerFilters
        value={filters}
        onChange={setFilters}
        priceCeiling={PRICE_CEILING}
        clubs={clubs}
      />
      <div className={isDesktop ? "max-h-[560px] space-y-2 overflow-y-auto pr-1" : "space-y-2"}>
        {candidates.map((player) => (
          <div key={player.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <PlayerRow player={player} />
            </div>
            <Button
              size="sm"
              disabled={makeTransfer.isPending}
              onClick={() => makeTransfer.mutate(player)}
            >
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
      {makeTransfer.isError ? (
        <p className="text-xs text-destructive">{(makeTransfer.error as Error).message}</p>
      ) : null}
    </>
  ) : (
    <EmptyState
      icon={ArrowLeftRight}
      title="Pick someone to transfer out"
      description="Tap a player on the pitch to see valid replacements."
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfers"
        subtitle={`Gameweek ${gameweek?.number ?? "—"} · like-for-like positions.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Budget available" value={formatRand(budgetLeft)} />
        <StatTile label="Transfers made" value={String(transfers.length)} />
        <StatTile label="Transferring out" value={outPlayer?.name ?? "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold">Your squad</h2>
            <Pitch
              squad={squad}
              starters={team.starters}
              captainId={team.captainId}
              outId={outId}
              onPlayerClick={(player) => {
                const next = outId === player.id ? null : player.id;
                setOutId(next);
                if (next && !isDesktop) setPoolOpen(true);
              }}
            />
            <p className="text-center text-xs text-muted-foreground">
              Tap the player you want to transfer out, then choose a replacement.
            </p>
          </CardBody>
        </Card>

        {isDesktop ? (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold">Transfer in</h2>
              {replacements}
            </CardBody>
          </Card>
        ) : (
          <Sheet open={poolOpen && Boolean(outPlayer)} onOpenChange={setPoolOpen}>
            <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Transfer in</SheetTitle>
                <SheetDescription>
                  Replacing {outPlayer?.name} · {formatRand(budgetLeft)} available
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">{replacements}</div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">Transfer history</h2>
          {transfers.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {transfers.map((transfer) => (
                <li key={transfer.id} className="rounded-2xl border border-border px-3 py-2">
                  GW {transfer.gameweek}:{" "}
                  {resolve(transfer.outPlayerId)?.name ?? transfer.outPlayerId} →{" "}
                  {resolve(transfer.inPlayerId)?.name ?? transfer.inPlayerId}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={ArrowLeftRight}
                title="No transfers yet"
                description="Your swaps will be listed here."
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}