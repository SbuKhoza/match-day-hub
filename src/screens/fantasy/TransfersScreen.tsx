import { useFantasySettings } from "@/hooks/useAdmin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, History, Info, Undo2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { DeadlineBanner } from "@/components/fantasy/DeadlineBanner";
import { CompactEmpty } from "@/components/fantasy/CompactEmpty";
import { FantasySectionHead } from "@/components/fantasy/FantasySectionHead";
import { FantasySubHeader } from "@/components/fantasy/FantasySubHeader";
import { Pitch } from "@/components/fantasy/Pitch";
import { PlayerFilters, type PlayerFilterState } from "@/components/fantasy/PlayerFilters";
import { PlayerRow } from "@/components/fantasy/PlayerRow";
import { SaveBar } from "@/components/fantasy/SaveBar";
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
import { useTransferAllowance } from "@/hooks/useTransferAllowance";
import { recordTransfer, saveFantasyTeam, validateSquad } from "@/services/fantasyService";
import {
  EXTRA_TRANSFER_PENALTY,
  FREE_TRANSFERS_PER_GAMEWEEK,
  MAX_BANKED_TRANSFERS,
} from "@/services/transferRules";
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
  /** Staged transfers. Nothing is written until the user saves. `outId` is the player originally in that slot. */
  const [swaps, setSwaps] = useState<{ outId: string; inId: string }[]>([]);
  const [poolOpen, setPoolOpen] = useState(false);
  const allowance = useTransferAllowance(swaps.length);
  const [filters, setFilters] = useState<PlayerFilterState>({
    search: "",
    position: "ALL",
    clubId: "ALL",
    maxPrice: PRICE_CEILING,
  });

  const resolve = (id: string) => byId.get(id);
  const inSlot = (id: string) => swaps.find((swap) => swap.outId === id)?.inId ?? id;

  // The squad as it would look with the staged transfers applied.
  const draftSquadIds = (team?.squad ?? []).map(inSlot);
  const draftStarters = (team?.starters ?? []).map(inSlot);
  const draftCaptainId = team?.captainId ? inSlot(team.captainId) : (team?.captainId ?? null);
  const draftViceId = team?.viceCaptainId ? inSlot(team.viceCaptainId) : (team?.viceCaptainId ?? null);
  const squad = draftSquadIds.map(resolve).filter(Boolean) as Player[];
  const outPlayer = outId ? byId.get(outId) : undefined;
  const spent = squad.reduce((sum, player) => sum + player.price, 0);
  const { budget } = useFantasySettings();
  const budgetLeft = budget - spent + (outPlayer?.price ?? 0);

  // Slot the selected player originally came from (so a swap can be reverted by picking them again).
  const originalOutId = swaps.find((swap) => swap.inId === outId)?.outId ?? outId;
  const stagedOutIds = new Set(swaps.map((swap) => swap.outId));

  const candidates = useMemo(
    () =>
      players
        .filter((player) => !draftSquadIds.includes(player.id))
        .filter((player) => !stagedOutIds.has(player.id) || player.id === originalOutId)
        .filter((player) => !outPlayer || player.position === outPlayer.position)
        .filter((player) => filters.position === "ALL" || player.position === filters.position)
        .filter((player) => filters.clubId === "ALL" || player.clubId === filters.clubId)
        .filter((player) => player.price <= Math.min(filters.maxPrice, budgetLeft))
        .filter((player) => player.name.toLowerCase().includes(filters.search.trim().toLowerCase()))
        .slice(0, 40),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players, swaps, team, outPlayer, filters, budgetLeft],
  );

  /** Stage a transfer in memory. The slot being replaced is `outId` (the player currently shown). */
  function stageSwap(incoming: Player) {
    if (!outId || !originalOutId) return;
    setSwaps((prev) => {
      const rest = prev.filter((swap) => swap.outId !== originalOutId);
      // Picking the player who was originally in the slot simply undoes the swap.
      return incoming.id === originalOutId ? rest : [...rest, { outId: originalOutId, inId: incoming.id }];
    });
    setOutId(null);
    setPoolOpen(false);
  }

  function undoSwap(slotOutId: string) {
    setSwaps((prev) => prev.filter((swap) => swap.outId !== slotOutId));
    setOutId(null);
  }

  function discard() {
    setSwaps([]);
    setOutId(null);
    setPoolOpen(false);
    makeTransfer.reset();
  }

  const makeTransfer = useMutation({
    mutationFn: async () => {
      if (!db || !uid || !team) throw new Error("You need to be signed in to save transfers.");
      if (swaps.length === 0) return;
      const nextPlayers = draftSquadIds.map(resolve).filter(Boolean) as Player[];
      const check = validateSquad(nextPlayers, draftStarters, budget);
      if (!check.valid) throw new Error(check.errors[0]!);
      const gameweekNumber = target?.number ?? gameweek?.number ?? 0;
      const saved = await saveFantasyTeam(
        db,
        uid,
        {
          name: team.name,
          squad: draftSquadIds,
          starters: draftStarters,
          captainId: draftCaptainId,
          viceCaptainId: draftViceId,
        },
        nextPlayers,
        gameweekNumber,
        { newTransfers: swaps.length },
      );
      const appliedGameweek = saved.appliedGameweek ?? gameweekNumber;
      for (const swap of swaps) {
        await recordTransfer(db, {
          uid,
          gameweek: appliedGameweek,
          outPlayerId: swap.outId,
          inPlayerId: swap.inId,
        });
      }
    },
    onSuccess: async () => {
      setSwaps([]);
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
              onClick={() => stageSwap(player)}
            >
              {player.id === originalOutId ? "Undo" : "Swap"}
            </Button>
          </div>
        ))}
        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No affordable replacements match those filters.
          </p>
        ) : null}
      </div>
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
          {
            label: "Free transfers",
            value: allowance.unlimited ? "Unlimited" : String(allowance.remaining),
            hint: allowance.unlimited ? "until the deadline" : `of ${allowance.available} this GW`,
          },
          { label: "Out", value: outPlayer?.name ?? "—", hint: outPlayer ? "tap again to cancel" : "none selected" },
        ]}
      />

      {allowance.extra > 0 ? (
        <p className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-300 ring-1 ring-red-500/20">
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />
          <span>
            You&apos;re making {allowance.extra} more {allowance.extra === 1 ? "transfer" : "transfers"} than
            you have free. This will cost you −{allowance.penalty} points in gameweek{" "}
            {allowance.gameweek || "—"}.
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {allowance.unlimited
              ? `Build freely: transfers are unlimited until this gameweek's deadline. After that you get ${FREE_TRANSFERS_PER_GAMEWEEK} free transfer each gameweek, and each extra costs −${EXTRA_TRANSFER_PENALTY} points.`
              : `You get ${FREE_TRANSFERS_PER_GAMEWEEK} free transfer every gameweek. Unused ones carry over, up to ${MAX_BANKED_TRANSFERS}. Each extra transfer costs −${EXTRA_TRANSFER_PENALTY} points.`}
          </span>
        </p>
      )}

      {makeTransfer.isSuccess && swaps.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Transfers saved.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="home-card space-y-3 p-3.5">
          <FantasySectionHead title="Your squad" icon={Users} />
          <Pitch
            squad={squad}
            starters={draftStarters}
            captainId={draftCaptainId}
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

      {swaps.length > 0 ? (
        <section>
          <FantasySectionHead title="Pending transfers" icon={ArrowLeftRight} />
          <ul className="home-card divide-y divide-white/5 overflow-hidden text-sm ring-1 ring-primary/30">
            {swaps.map((swap) => (
              <li key={swap.outId} className="flex items-center gap-2.5 px-3.5 py-2.5">
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-red-400">{resolve(swap.outId)?.name ?? swap.outId}</span>
                  <span className="px-1.5 text-muted-foreground">→</span>
                  <span className="text-emerald-400">{resolve(swap.inId)?.name ?? swap.inId}</span>
                </span>
                <button
                  type="button"
                  aria-label="Undo this transfer"
                  disabled={makeTransfer.isPending}
                  onClick={() => undoSwap(swap.outId)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

      {swaps.length > 0 ? (
        <SaveBar
          title={`${swaps.length} unsaved ${swaps.length === 1 ? "transfer" : "transfers"}`}
          detail={
            allowance.unlimited
              ? "Unlimited transfers"
              : allowance.extra > 0
                ? `−${allowance.penalty} pts penalty`
                : `${allowance.remaining} free left`
          }
          saveLabel="Save transfers"
          saving={makeTransfer.isPending}
          error={makeTransfer.isError ? (makeTransfer.error as Error).message : null}
          onSave={() => makeTransfer.mutate()}
          onDiscard={discard}
        />
      ) : null}
    </div>
  );
}