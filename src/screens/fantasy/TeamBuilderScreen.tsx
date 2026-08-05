import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { PlayerFilters, type PlayerFilterState } from "@/components/fantasy/PlayerFilters";
import { PlayerRow } from "@/components/fantasy/PlayerRow";
import { SquadList } from "@/components/fantasy/SquadList";
import { StatTile } from "@/components/fantasy/StatTile";
import { useFantasyDb, useFantasyTeam, usePlayers } from "@/hooks/useFantasy";
import { saveFantasyTeam, validateSquad } from "@/services/fantasyService";
import { SQUAD_RULES, SQUAD_SIZE, type Player, type PlayerPosition } from "@/types/fantasy";
import { formatRand } from "@/utils/format";

const POSITION_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];

export function TeamBuilderScreen() {
  const { db, uid } = useFantasyDb();
  const queryClient = useQueryClient();
  const { data: players = [] } = usePlayers();
  const { data: existing } = useFantasyTeam();

  const [name, setName] = useState("");
  const [squadIds, setSquadIds] = useState<string[]>([]);
  const [starters, setStarters] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [filters, setFilters] = useState<PlayerFilterState>({
    search: "",
    position: "ALL",
    clubId: "ALL",
    maxPrice: 15_000_000,
  });

  if (existing && !hydrated) {
    setHydrated(true);
    setName(existing.name);
    setSquadIds(existing.squad);
    setStarters(existing.starters);
    setCaptainId(existing.captainId);
  }

  const byId = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const squad = squadIds.map((id) => byId.get(id)).filter(Boolean) as Player[];
  const validation = validateSquad(squad, starters);
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
    return validation.spent + player.price <= SQUAD_RULES.budget;
  }

  function togglePlayer(player: Player) {
    if (squadIds.includes(player.id)) {
      setSquadIds((prev) => prev.filter((id) => id !== player.id));
      setStarters((prev) => prev.filter((id) => id !== player.id));
      setCaptainId((prev) => (prev === player.id ? null : prev));
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
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!db || !uid) throw new Error("You need to be signed in to save a team.");
      await saveFantasyTeam(db, uid, {
        name: name.trim() || "My Fantasy XI",
        squad: squadIds,
        starters,
        captainId,
        viceCaptainId: starters.find((id) => id !== captainId) ?? null,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fantasy", "team", uid] }),
  });

  const complete = squadIds.length === SQUAD_SIZE && validation.valid && Boolean(captainId);

  return (
    <div className="space-y-6">
      <PageHeader title="Team builder" subtitle="Budget R100.0m · 17 players · max 3 per club." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Remaining budget" value={formatRand(validation.remaining)} />
        <StatTile label="Squad" value={`${squadIds.length}/${SQUAD_SIZE}`} hint={`${SQUAD_SIZE - squadIds.length} slots left`} />
        <StatTile label="Starting XI" value={`${starters.length}/${SQUAD_RULES.starters}`} />
        <StatTile
          label="Formation"
          value={POSITION_ORDER.slice(1)
            .map((position) => squad.filter((p) => p.position === position && starters.includes(p.id)).length)
            .join("-")}
          hint="DEF-MID-FWD in your XI"
        />
      </div>

      <Card>
        <CardBody className="space-y-3">
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
          <div className="grid gap-2 sm:grid-cols-4">
            {POSITION_ORDER.map((position) => (
              <div key={position} className="rounded-2xl border border-border px-3 py-2 text-sm">
                <span className="text-muted-foreground">{position}</span>{" "}
                <span className="font-semibold">
                  {validation.counts[position]}/{SQUAD_RULES.positions[position]}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold">Player pool</h2>
            <PlayerFilters value={filters} onChange={setFilters} priceCeiling={15_000_000} />
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
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
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold">Selected players</h2>
            {squad.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-10 text-center">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Add players from the pool to fill your 17 slots.
                </p>
              </div>
            ) : (
              <SquadList
                squad={squad}
                starters={starters}
                captainId={captainId}
                onToggleStarter={toggleStarter}
                onSetCaptain={setCaptainId}
                onRemove={(id) => {
                  const player = byId.get(id);
                  if (player) togglePlayer(player);
                }}
              />
            )}

            {validation.errors.length > 0 || !captainId ? (
              <ul className="space-y-1.5 rounded-2xl border border-border p-3 text-xs text-muted-foreground">
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

            <Button block size="lg" disabled={!complete || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : existing ? "Update team" : "Save team"}
            </Button>
            {save.isError ? (
              <p className="text-xs text-destructive">{(save.error as Error).message}</p>
            ) : null}
            {save.isSuccess ? <p className="text-xs text-muted-foreground">Team saved.</p> : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
