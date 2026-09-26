import { useMemo, useState } from "react";

import { EditorDialog, Field, RowActions, inputClass, slugId } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdminAction } from "@/hooks/useAdmin";
import { useFirestore, usePlayers, useTeams } from "@/hooks/useMasterData";
import { deletePlayer, savePlayer } from "@/services/adminService";
import type { PlayerPosition } from "@/types/fantasy";
import { CURRENT_SEASON, normalizeName, type MasterPlayer, type PlayerStatus } from "@/types/master";
import { formatRand } from "@/utils/format";

const POSITIONS: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];
const STATUSES: PlayerStatus[] = ["active", "injured", "suspended", "transferred", "inactive"];

const blank = (): MasterPlayer => {
  const now = new Date().toISOString();
  return {
    playerId: "",
    playerName: "",
    playerNameNormalized: "",
    teamId: "",
    teamName: "",
    position: null,
    positionRaw: null,
    shirtNumber: null,
    nationality: null,
    dateOfBirth: null,
    worldfootballUrl: null,
    sportscorePlayerId: null,
    sportscoreSlug: null,
    sportscoreName: null,
    season: CURRENT_SEASON,
    active: true,
    status: "active",
    fantasyPrice: null,
    fantasyPoints: 0,
    source: "manual",
    scrapedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

export function AdminPlayersScreen() {
  const { db } = useFirestore();
  const players = usePlayers();
  const teams = useTeams();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [draft, setDraft] = useState<MasterPlayer | null>(null);
  const [priceText, setPriceText] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useAdminAction((p: MasterPlayer) => savePlayer(db!, p), [["master"]]);
  const remove = useAdminAction((id: string) => deletePlayer(db!, id), [["master"]]);

  const set = <K extends keyof MasterPlayer>(key: K, value: MasterPlayer[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  const text = (value: string) => (value.trim() ? value.trim() : null);

  const list = useMemo(() => {
    const key = normalizeName(search);
    return (players.data ?? []).filter(
      (p) => (!teamFilter || p.teamId === teamFilter) && (!key || p.playerNameNormalized.includes(key)),
    );
  }, [players.data, search, teamFilter]);

  function open(player: MasterPlayer, fresh: boolean) {
    setIsNew(fresh);
    setError(null);
    setPriceText(player.fantasyPrice !== null ? String(player.fantasyPrice / 1_000_000) : "");
    setDraft(player);
  }

  function submit() {
    if (!draft) return;
    const playerName = draft.playerName.trim();
    if (!playerName) return setError("Player name is required.");
    const team = teams.data?.find((t) => t.teamId === draft.teamId);
    if (!team) return setError("Choose a club.");
    if (!draft.position) return setError("Choose a position.");
    const playerId = isNew ? draft.playerId.trim() || `${slugId(playerName)}-${Date.now().toString(36)}` : draft.playerId;
    if (isNew && players.data?.some((p) => p.playerId === playerId))
      return setError("A player with this ID already exists.");
    let fantasyPrice: number | null = null;
    if (priceText.trim()) {
      const millions = Number(priceText);
      if (!Number.isFinite(millions) || millions <= 0) return setError("Price must be a positive number (in millions).");
      fantasyPrice = Math.round(millions * 1_000_000);
    }
    setError(null);
    save.mutate(
      {
        ...draft,
        playerId,
        playerName,
        playerNameNormalized: normalizeName(playerName),
        teamName: team.teamName,
        fantasyPrice,
        updatedAt: new Date().toISOString(),
      },
      { onSuccess: () => setDraft(null), onError: () => setError("Could not save. Try again.") },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Players" subtitle="Add, edit or remove players and set their fantasy price." />
        <Button onClick={() => open(blank(), true)} disabled={(teams.data ?? []).length === 0}>
          Add player
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Search players"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={`${inputClass} max-w-xs`} value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="">All clubs</option>
          {(teams.data ?? []).map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.teamName}
            </option>
          ))}
        </select>
      </div>

      {players.isLoading ? <LoadingState label="Loading players…" /> : null}
      {!players.isLoading && list.length === 0 ? (
        <EmptyMessage
          title="No players found."
          {...((teams.data ?? []).length === 0 ? { description: "Add a club first." } : {})}
        />
      ) : null}
      {list.length > 0 ? (
        <Card>
          <CardBody className="divide-y divide-border p-2">
            {list.slice(0, 200).map((player) => (
              <div key={player.playerId} className="flex items-center gap-3 px-2 py-2.5">
                <span className="w-10 text-xs font-semibold text-muted-foreground">{player.position ?? "—"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{player.playerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {player.teamName} · {player.fantasyPrice !== null ? formatRand(player.fantasyPrice) : "No price"} ·{" "}
                    {player.status}
                  </p>
                </div>
                <RowActions onEdit={() => open(player, false)} onDelete={() => remove.mutate(player.playerId)} />
              </div>
            ))}
            {list.length > 200 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">Showing 200 of {list.length}. Narrow the search.</p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <EditorDialog
        open={draft !== null}
        title={isNew ? "Add player" : "Edit player"}
        onClose={() => setDraft(null)}
        onSave={submit}
        saving={save.isPending}
        error={error}
      >
        {draft ? (
          <>
            <Field label="Player name *">
              <input className={inputClass} value={draft.playerName} onChange={(e) => set("playerName", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Club *">
                <select className={inputClass} value={draft.teamId} onChange={(e) => set("teamId", e.target.value)}>
                  <option value="">Select a team</option>
                  {(teams.data ?? []).map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Position *">
                <select
                  className={inputClass}
                  value={draft.position ?? ""}
                  onChange={(e) => set("position", (e.target.value || null) as PlayerPosition | null)}
                >
                  <option value="">Select</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fantasy price (R millions)">
                <input className={inputClass} inputMode="decimal" value={priceText} onChange={(e) => setPriceText(e.target.value)} />
              </Field>
              <Field label="Shirt number">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={draft.shirtNumber ?? ""}
                  onChange={(e) => set("shirtNumber", e.target.value ? Number(e.target.value) || null : null)}
                />
              </Field>
              <Field label="Nationality">
                <input className={inputClass} value={draft.nationality ?? ""} onChange={(e) => set("nationality", text(e.target.value))} />
              </Field>
              <Field label="Date of birth">
                <input
                  type="date"
                  className={inputClass}
                  value={draft.dateOfBirth ?? ""}
                  onChange={(e) => set("dateOfBirth", text(e.target.value))}
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={draft.status}
                  onChange={(e) => {
                    const status = e.target.value as PlayerStatus;
                    set("status", status);
                    set("active", status !== "inactive" && status !== "transferred");
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="SportScore slug">
                <input
                  className={inputClass}
                  value={draft.sportscoreSlug ?? ""}
                  onChange={(e) => set("sportscoreSlug", text(e.target.value))}
                />
              </Field>
            </div>
            {!isNew ? <p className="text-xs text-muted-foreground">Player ID {draft.playerId} stays the same after club changes.</p> : null}
          </>
        ) : null}
      </EditorDialog>
    </div>
  );
}
