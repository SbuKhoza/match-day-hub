import { useFantasySettings } from "@/hooks/useAdmin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeftRight, CheckCircle2, Lock, Plus, Shirt, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DeadlineBanner } from "@/components/fantasy/DeadlineBanner";
import { FantasySubHeader } from "@/components/fantasy/FantasySubHeader";
import { Pitch } from "@/components/fantasy/Pitch";
import { PlayerFilters, type PlayerFilterState } from "@/components/fantasy/PlayerFilters";
import { PlayerRow } from "@/components/fantasy/PlayerRow";
import { SaveButton } from "@/components/fantasy/SaveButton";
import { StatTile } from "@/components/fantasy/StatTile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useEditableGameweek,
  useFantasyDb,
  useFantasyTeam,
  useGameweek,
  usePlayers,
} from "@/hooks/useFantasy";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { saveFantasyTeam, validateSquad } from "@/services/fantasyService";
import { isTeamBuiltForSeason } from "@/services/seasonRules";
import { CURRENT_SEASON } from "@/types/master";
import { SQUAD_RULES, SQUAD_SIZE, type Player, type PlayerPosition } from "@/types/fantasy";
import { formatRand } from "@/utils/format";

const POSITION_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];
const PRICE_CEILING = 30_000_000;

export function TeamBuilderScreen() {
  const { db, uid } = useFantasyDb();
  const queryClient = useQueryClient();
  const { data: players, byId, clubs, isLoading } = usePlayers();
  const { data: existing } = useFantasyTeam();
  const { data: gameweek } = useGameweek();
  const { target, now } = useEditableGameweek();
  const { budget } = useFantasySettings();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [name, setName] = useState("");
  const [squadIds, setSquadIds] = useState<string[]>([]);
  const [starters, setStarters] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [poolOpen, setPoolOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [filters, setFilters] = useState<PlayerFilterState>({
    search: "",
    position: "ALL",
    clubId: "ALL",
    maxPrice: PRICE_CEILING,
  });

  if (existing && !hydrated) {
    setHydrated(true);
    setName(existing.name);
    setSquadIds(existing.squad);
    setStarters(existing.starters);
    setCaptainId(existing.captainId);
  }

  const squad = squadIds.map((id) => byId.get(id)).filter(Boolean) as Player[];
  const validation = validateSquad(squad, starters, budget);
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const clubCounts = useMemo(() => {
    const counts = new Map<string, number>();
    squad.forEach((player) => counts.set(player.clubId, (counts.get(player.clubId) ?? 0) + 1));
    return counts;
  }, [squad]);

  const visible = useMemo(
    () =>
      players
        .filter((player) => filters.position === "ALL" || player.position === filters.position)
        .filter((player) => filters.clubId === "ALL" || player.clubId === filters.clubId)
        .filter((player) => player.price <= filters.maxPrice)
        .filter((player) => player.name.toLowerCase().includes(filters.search.trim().toLowerCase()))
        .sort((a, b) => b.price - a.price)
        .slice(0, 60),
    [players, filters],
  );

  function canAdd(player: Player): boolean {
    if (squadIds.length >= SQUAD_SIZE) return false;
    if (validation.counts[player.position] >= SQUAD_RULES.positions[player.position]) return false;
    if ((clubCounts.get(player.clubId) ?? 0) >= SQUAD_RULES.maxPerClub) return false;
    return validation.spent + player.price <= budget;
  }

  function togglePlayer(player: Player) {
    if (squadIds.includes(player.id)) {
      setSquadIds((prev) => prev.filter((id) => id !== player.id));
      setStarters((prev) => prev.filter((id) => id !== player.id));
      setCaptainId((prev) => (prev === player.id ? null : prev));
      setSelectedId((prev) => (prev === player.id ? null : prev));
      return;
    }
    if (!canAdd(player)) return;
    setSquadIds((prev) => [...prev, player.id]);
    if (starters.length < SQUAD_RULES.starters) setStarters((prev) => [...prev, player.id]);
  }

  function toggleStarter(playerId: string) {
    setStarters((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= SQUAD_RULES.starters) return prev;
      return [...prev, playerId];
    });
    // A benched player can't be captain.
    setCaptainId((prev) => (prev === playerId && starters.includes(playerId) ? null : prev));
  }

  function openPoolFor(position: PlayerPosition | "ALL") {
    setFilters((prev) => ({ ...prev, position }));
    setPoolOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!db || !uid) throw new Error("You need to be signed in to save a team.");
      await saveFantasyTeam(
        db,
        uid,
        {
          name: name.trim() || "My Fantasy XI",
          squad: squadIds,
          starters,
          captainId,
          viceCaptainId: starters.find((id) => id !== captainId) ?? null,
        },
        squad,
        gameweek?.number ?? 0,
        { isBuilder: true },
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fantasy", "team", uid] }),
  });

  const complete = squadIds.length === SQUAD_SIZE && validation.valid && Boolean(captainId);

  if (isLoading) return <LoadingState label="Loading players…" />;

  if (players.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Team builder" subtitle="Budget R220.0m · 17 players · max 3 per club." />
        <EmptyMessage
          title="No players have been imported yet."
          description="Squad selection opens once an administrator imports the club and player files and sets prices."
        />
      </div>
    );
  }

  const pool = (
    <div className="space-y-4">
      <PlayerFilters
        value={filters}
        onChange={setFilters}
        priceCeiling={PRICE_CEILING}
        clubs={clubs}
      />
      <div className={isDesktop ? "max-h-[640px] space-y-2 overflow-y-auto pr-1" : "space-y-2"}>
        {visible.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            selected={squadIds.includes(player.id)}
            disabled={!canAdd(player)}
            onToggle={togglePlayer}
          />
        ))}
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No players match those filters.
          </p>
        ) : null}
      </div>
    </div>
  );

  const selectedStarting = selected ? starters.includes(selected.id) : false;

  // The builder works once per season. After the team is saved it is locked until next season.
  if (isTeamBuiltForSeason(existing)) {
    return (
      <div className="-mt-3 space-y-5 sm:-mt-4">
        <FantasySubHeader title="Team builder" subtitle={`Season ${CURRENT_SEASON}`} />
        {save.isSuccess ? (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Team saved. Welcome to the season!
          </p>
        ) : null}
        <section className="home-card space-y-4 p-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.07]">
            <Lock className="h-6 w-6 text-gold" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold">Your team is locked in for {CURRENT_SEASON}</h2>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              The team builder can only be used once per season, and it opens again next season. Change
              players with Transfers, or set your starting XI and captain in Pick Team.
            </p>
          </div>
          <div className="mx-auto grid max-w-sm grid-cols-2 gap-2.5">
            <Link
              to="/fantasy/transfers"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden /> Transfers
            </Link>
            <Link
              to="/fantasy/lineup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2.5 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"
            >
              <Shirt className="h-4 w-4" aria-hidden /> Pick team
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Team builder" subtitle="Budget R220.0m · 17 players · max 3 per club." />
      <DeadlineBanner target={target} now={now} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Remaining budget" value={formatRand(validation.remaining)} />
        <StatTile
          label="Squad"
          value={`${squadIds.length}/${SQUAD_SIZE}`}
          hint={`${SQUAD_SIZE - squadIds.length} slots left`}
        />
        <StatTile label="Starting XI" value={`${starters.length}/${SQUAD_RULES.starters}`} />
        <StatTile
          label="Formation"
          value={POSITION_ORDER.slice(1)
            .map(
              (position) =>
                squad.filter((p) => p.position === position && starters.includes(p.id)).length,
            )
            .join("-")}
          hint="DEF-MID-FWD in your XI"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="team-name">
                Team name
              </label>
              <input
                id="team-name"
                value={name}
                maxLength={40}
                onChange={(event) => setName(event.target.value)}
                placeholder="My Fantasy XI"
                className="h-11 w-full rounded-full border border-border bg-transparent px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {POSITION_ORDER.map((position) => (
                <div
                  key={position}
                  className="rounded-lg border border-border px-2 py-1.5 text-center text-xs sm:text-sm"
                >
                  <span className="text-muted-foreground">{position}</span>{" "}
                  <span className="font-semibold">
                    {validation.counts[position]}/{SQUAD_RULES.positions[position]}
                  </span>
                </div>
              ))}
            </div>

            <Pitch
              squad={squad}
              starters={starters}
              captainId={captainId}
              selectedId={selectedId}
              onPlayerClick={(player) =>
                setSelectedId((prev) => (prev === player.id ? null : player.id))
              }
              onEmptyClick={openPoolFor}
            />

            {selected ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{selected.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selected.position} · {selected.clubShort ?? selected.clubName} ·{" "}
                    {formatRand(selected.price)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={captainId === selected.id ? "primary" : "outline"}
                  disabled={!selectedStarting}
                  title={selectedStarting ? undefined : "Only starters can captain"}
                  onClick={() => setCaptainId(selected.id)}
                >
                  <Star className="h-4 w-4" /> Captain
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedStarting && starters.length >= SQUAD_RULES.starters}
                  onClick={() => toggleStarter(selected.id)}
                >
                  {selectedStarting ? "Bench" : "Start"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => togglePlayer(selected)}>
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Tap a slot to add a player, or tap a player to set captain, start/bench or remove.
                Faded players are on the bench.
              </p>
            )}

            {!isDesktop ? (
              <Button block variant="secondary" onClick={() => openPoolFor("ALL")}>
                <Plus className="h-4 w-4" /> Browse player pool
              </Button>
            ) : null}

            {validation.errors.length > 0 || !captainId ? (
              <ul className="space-y-1.5 rounded-lg border border-border p-3 text-xs text-muted-foreground">
                {validation.errors.map((error) => (
                  <li key={error} className="flex gap-2">
                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                    {error}
                  </li>
                ))}
                {!captainId ? (
                  <li className="flex gap-2">
                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                    Pick a captain from your starting XI.
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" /> Squad is valid and ready to save.
              </p>
            )}

            <SaveButton
              label={existing ? "Update team" : "Save team"}
              pendingLabel="Saving team…"
              pending={save.isPending}
              disabled={!complete}
              onClick={() => save.mutate()}
            />
            {save.isError ? (
              <p className="text-xs text-destructive">{(save.error as Error).message}</p>
            ) : null}
            {save.isSuccess ? (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Team saved.
              </p>
            ) : null}
          </CardBody>
        </Card>

        {isDesktop ? (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold">Player pool</h2>
              {pool}
            </CardBody>
          </Card>
        ) : (
          <Sheet open={poolOpen} onOpenChange={setPoolOpen}>
            <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Player pool</SheetTitle>
                <SheetDescription>
                  {formatRand(validation.remaining)} left · {squadIds.length}/{SQUAD_SIZE} picked
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">{pool}</div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}