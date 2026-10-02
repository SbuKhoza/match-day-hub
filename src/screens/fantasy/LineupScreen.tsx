import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, Shield, Star, Users, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { ChipsPanel } from "@/components/fantasy/ChipsPanel";
import { DeadlineBanner } from "@/components/fantasy/DeadlineBanner";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { LineupPitch } from "@/components/fantasy/LineupPitch";
import { StatTile } from "@/components/fantasy/StatTile";
import { useEditableGameweek, useFantasyDb, useFantasyTeam, usePlayers } from "@/hooks/useFantasy";
import { NO_CHIPS, sameChips, type ChipKey } from "@/services/chipService";
import { saveFantasyTeam } from "@/services/fantasyService";
import { formatKickoff } from "@/utils/format";
import {
  benchOf,
  canSubstitute,
  lineupFromTeam,
  normaliseLineup,
  sameLineup,
  sameStarters,
  setCaptain,
  setViceCaptain,
  substitute,
  swapBlockedReason,
  type Lineup,
} from "@/services/lineupService";
import { SQUAD_RULES, SQUAD_SIZE, type GameweekChips, type Player } from "@/types/fantasy";

/**
 * Gameweek line-up. The user sees only their saved squad: the XI on the pitch and the subs on the
 * bench. The only edit available is swapping a starter with a substitute (plus the armband) —
 * bringing in players from outside the squad is done on the Transfers screen.
 *
 * Changes always apply to the next gameweek that has not hit its deadline. The Double Captain and
 * Bench Boost chips live here, and only here.
 */
export function LineupScreen() {
  const { db, uid } = useFantasyDb();
  const queryClient = useQueryClient();
  const { data: team, isLoading: teamLoading } = useFantasyTeam();
  const { byId, isLoading: playersLoading } = usePlayers();
  const { target, half, now } = useEditableGameweek();

  const [draft, setDraft] = useState<Lineup | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draftChips, setDraftChips] = useState<GameweekChips | null>(null);

  const saved = useMemo(() => (team ? lineupFromTeam(team) : null), [team]);

  const squad = useMemo(
    () => (team?.squad ?? []).map((id) => byId.get(id)).filter(Boolean) as Player[],
    [team, byId],
  );

  // A saved XI that breaks the rules (e.g. 2 goalkeepers) is repaired here, and shows as unsaved.
  const repaired = useMemo(
    () => (saved && squad.length > 0 ? normaliseLineup(squad, saved) : saved),
    [saved, squad],
  );
  const lineup = draft ?? repaired;
  const wasRepaired = Boolean(saved && repaired && !sameStarters(saved, repaired));

  // Edits always go to the open gameweek: once a deadline passes the target moves to the next one.
  const editingGw = target?.number ?? team?.gameweek ?? 0;
  const savedChips = team?.lineups?.[String(editingGw)]?.chips ?? NO_CHIPS;
  const chips = draftChips ?? savedChips;
  const lineupDirty = Boolean(lineup && saved && !sameLineup(lineup, saved));
  const dirty = lineupDirty || !sameChips(chips, savedChips);

  const starters = lineup ? squad.filter((p) => lineup.starters.includes(p.id)) : [];
  const bench = lineup ? benchOf(squad, lineup.starters) : [];
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const selectedIsStarter = Boolean(selected && lineup?.starters.includes(selected.id));

  /** Valid swap partners for the current selection (always from the opposite group). */
  const targetIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selected || !lineup) return ids;
    if (lineup.starters.includes(selected.id)) {
      for (const sub of benchOf(squad, lineup.starters)) {
        if (canSubstitute(selected, sub, squad, lineup.starters)) ids.add(sub.id);
      }
    } else {
      for (const starter of squad.filter((p) => lineup.starters.includes(p.id))) {
        if (canSubstitute(starter, selected, squad, lineup.starters)) ids.add(starter.id);
      }
    }
    return ids;
  }, [selected, lineup, squad]);

  const save = useMutation({
    mutationFn: async () => {
      if (!db || !uid || !team || !lineup) throw new Error("You need to be signed in to save.");
      await saveFantasyTeam(
        db,
        uid,
        {
          name: team.name,
          squad: team.squad, // never changed on this screen
          starters: lineup.starters,
          captainId: lineup.captainId,
          viceCaptainId: lineup.viceCaptainId,
        },
        squad,
        editingGw,
        { chips },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fantasy", "team", uid] });
      setDraft(null);
      setDraftChips(null);
      setSelectedId(null);
      setNotice(null);
    },
  });

  function toggleChip(chip: ChipKey) {
    setDraftChips({ ...chips, [chip]: !chips[chip] });
  }

  if (teamLoading || playersLoading) return <LoadingState label="Loading your line-up…" />;

  const ready =
    team &&
    team.squad.length === SQUAD_SIZE &&
    team.starters.length === SQUAD_RULES.starters &&
    squad.length === SQUAD_SIZE;

  if (!team || !ready || !lineup) {
    return (
      <div className="space-y-6">
        <PageHeader title="My line-up" subtitle="Pick who plays in the next gameweek." />
        <EmptyState
          icon={Users}
          title={team ? "Finish your squad first" : "Build a team first"}
          description="Your line-up unlocks once you've saved a full 17-player squad with a starting XI."
          action={
            <Link
              to="/fantasy/team"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Go to team builder
            </Link>
          }
        />
      </div>
    );
  }

  const formation = (["DEF", "MID", "FWD"] as const)
    .map((position) => starters.filter((p) => p.position === position).length)
    .join("-");

  function handlePlayerClick(player: Player) {
    if (!lineup) return;
    setNotice(null);

    if (!selectedId || selectedId === player.id) {
      setSelectedId((prev) => (prev === player.id ? null : player.id));
      return;
    }

    if (targetIds.has(player.id)) {
      const outId = lineup.starters.includes(player.id) ? player.id : selectedId;
      const inId = outId === player.id ? selectedId : player.id;
      setDraft(substitute(lineup, outId, inId));
      setSelectedId(null);
      return;
    }

    const sameGroup = lineup.starters.includes(player.id) === selectedIsStarter;
    if (sameGroup) {
      setSelectedId(player.id); // just change the selection
    } else if (selected) {
      const [starter, sub] = selectedIsStarter ? [selected, player] : [player, selected];
      setNotice(swapBlockedReason(starter, sub, squad, lineup.starters));
    }
  }

  const captainAllowed = selected && selectedIsStarter;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My line-up"
        subtitle={`Gameweek ${target?.number ?? "—"} · swap your starters with your substitutes.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Formation" value={formation} hint="DEF-MID-FWD" />
        <StatTile
          label="Deadline"
          value={target?.deadline ? formatKickoff(new Date(target.deadline).toISOString()) : "—"}
          icon={Clock}
        />
        <StatTile
          label="Captain"
          value={byId.get(lineup.captainId ?? "")?.name ?? "—"}
          icon={Star}
        />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <DeadlineBanner target={target} now={now} />

          {wasRepaired && dirty ? (
            <p className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              Your saved XI didn&apos;t follow the rules (1 goalkeeper, at least 3 defenders), so
              we&apos;ve adjusted it. Save the line-up to keep the change.
            </p>
          ) : null}

          <LineupPitch
            starters={starters}
            bench={bench}
            captainId={lineup.captainId}
            viceCaptainId={lineup.viceCaptainId}
            selectedId={selectedId}
            targetIds={targetIds}
            onPlayerClick={handlePlayerClick}
          />

          <div aria-live="polite">
            {selected ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {targetIds.size > 0
                      ? selectedIsStarter
                        ? "Tap a highlighted substitute to bring them on."
                        : "Tap a highlighted starter to replace them."
                      : "No valid swaps for this player."}
                  </p>
                </div>
                {captainAllowed ? (
                  <>
                    <Button
                      size="sm"
                      variant={lineup.captainId === selected.id ? "primary" : "outline"}
                      onClick={() => setDraft(setCaptain(lineup, selected.id))}
                    >
                      <Star className="h-4 w-4" /> Captain
                    </Button>
                    <Button
                      size="sm"
                      variant={lineup.viceCaptainId === selected.id ? "primary" : "outline"}
                      onClick={() => setDraft(setViceCaptain(lineup, selected.id))}
                    >
                      <Shield className="h-4 w-4" /> Vice
                    </Button>
                  </>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Tap a starter or a substitute, then tap the player to swap with.
              </p>
            )}
            {notice ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {notice}
              </p>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!dirty || save.isPending}
              onClick={() => {
                setDraft(null);
                setDraftChips(null);
                setSelectedId(null);
                setNotice(null);
              }}
            >
              Reset
            </Button>
            <Button
              block
              size="lg"
              disabled={!dirty || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving…" : "Save line-up"}
            </Button>
          </div>
          {save.isError ? (
            <p className="text-xs text-destructive">{(save.error as Error).message}</p>
          ) : null}
          {save.isSuccess && !dirty ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" /> Line-up saved.
            </p>
          ) : null}
        </CardBody>
      </Card>

      <ChipsPanel
        lineups={team.lineups}
        chips={chips}
        gameweek={editingGw}
        half={half}
        onToggle={toggleChip}
        disabled={save.isPending}
      />

      <p className="text-center text-xs text-muted-foreground">
        Want different players in your squad?{" "}
        <Link to="/fantasy/transfers" className="underline">
          Make a transfer
        </Link>
        .
      </p>
    </div>
  );
}