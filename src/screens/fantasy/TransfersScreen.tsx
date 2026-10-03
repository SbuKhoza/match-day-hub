import { useFantasySettings } from "@/hooks/useAdmin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, History, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { DeadlineBanner } from "@/components/fantasy/DeadlineBanner";
import { CompactEmpty } from "@/components/fantasy/CompactEmpty";
import { FantasySectionHead } from "@/components/fantasy/FantasySectionHead";
import { FantasySubHeader } from "@/components/fantasy/FantasySubHeader";
import { Pitch } from "@/components/fantasy/Pitch";
import { PlayerFilters, type PlayerFilterState } from "@/components/fantasy/PlayerFilters";
import { PlayerRow } from "@/components/fantasy/PlayerRow";
import { StatStrip } from "@/components/fantasy/StatStrip";
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
  useEditableGameweek,
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
  const { target, now } = useEditableGameweek();

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
        target?.number ?? gameweek?.number ?? 0,
      );
      await recordTransfer(db, {
        uid,
        gameweek: target?.number ?? gameweek?.number ?? 0,
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
      <div className="-mt-3 space-y-5 sm:-mt-4">
        <FantasySubHeader title="Transfers" subtitle="Swap players in and out of your squad." />
        <CompactEmpty
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
          <p className="py-6 text-center text-sm text-muted-foreground">
            No affordable replacements match those filters.
          </p>
        ) : null}
      </div>
      {makeTransfer.isError ? (
        <p className="text-xs text-destructive">{(makeTransfer.error as Error).message}</p>
      ) : null}
    </>
  ) : (
    <CompactEmpty
      icon={ArrowLeftRight}
      title="Pick someone to transfer out"
      description="Tap a player on the pitch to see valid replacements."
    />
  );

  return (
    <div className="-mt-3 space-y-5 sm:-mt-4">
      <FantasySubHeader
        title="Transfers"
        subtitle={`Gameweek ${target?.number ?? gameweek?.number ?? "—"} · like-for-like positions`}
      />
      <DeadlineBanner target={target} now={now} />

      <StatStrip
        items={[
          { label: "Budget", value: formatRand(budgetLeft), hint: "available" },
          { label: "Transfers", value: String(transfers.length), hint: "made" },
          { label: "Out", value: outPlayer?.name ?? "—", hint: outPlayer ? "tap again to cancel" : "none selected" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="home-card space-y-3 p-3.5">
          <FantasySectionHead title="Your squad" icon={Users} />
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
        </section>

        {isDesktop ? (
          <section className="home-card space-y-3 p-3.5">
            <FantasySectionHead title="Transfer in" icon={ArrowLeftRight} />
            {replacements}
          </section>
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

      <section>
        <FantasySectionHead title="Transfer history" icon={History} />
        {transfers.length > 0 ? (
          <ul className="home-card divide-y divide-white/5 overflow-hidden text-sm">
            {transfers.map((transfer) => (
              <li key={transfer.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                <span className="shrink-0 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-semibold">
                  GW {transfer.gameweek}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-red-400">
                    {resolve(transfer.outPlayerId)?.name ?? transfer.outPlayerId}
                  </span>
                  <span className="px-1.5 text-muted-foreground">→</span>
                  <span className="text-emerald-400">
                    {resolve(transfer.inPlayerId)?.name ?? transfer.inPlayerId}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <CompactEmpty
            icon={ArrowLeftRight}
            title="No transfers yet"
            description="Your swaps will be listed here."
          />
        )}
      </section>
    </div>
  );
}