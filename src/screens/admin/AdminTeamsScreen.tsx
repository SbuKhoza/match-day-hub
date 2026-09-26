import { useState } from "react";

import { EditorDialog, Field, RowActions, inputClass, slugId } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { TeamBadge } from "@/components/common/TeamBadge";
import { useAdminAction } from "@/hooks/useAdmin";
import { useFirestore, useTeams } from "@/hooks/useMasterData";
import { deleteTeam, saveTeam } from "@/services/adminService";
import { CURRENT_SEASON, type MasterTeam } from "@/types/master";

const blank = (): MasterTeam => {
  const now = new Date().toISOString();
  return {
    teamId: "",
    teamName: "",
    shortName: null,
    country: "South Africa",
    stadium: null,
    logo: null,
    worldfootballUrl: null,
    sportscoreSlug: null,
    season: CURRENT_SEASON,
    active: true,
    source: "manual",
    scrapedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

export function AdminTeamsScreen() {
  const { db } = useFirestore();
  const teams = useTeams();
  const [draft, setDraft] = useState<MasterTeam | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useAdminAction((team: MasterTeam) => saveTeam(db!, team), [["master"]]);
  const remove = useAdminAction((id: string) => deleteTeam(db!, id), [["master"]]);

  const set = <K extends keyof MasterTeam>(key: K, value: MasterTeam[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  const text = (value: string) => (value.trim() ? value.trim() : null);

  function submit() {
    if (!draft) return;
    const teamName = draft.teamName.trim();
    const teamId = isNew ? draft.teamId.trim() || slugId(teamName) : draft.teamId;
    if (!teamName) return setError("Club name is required.");
    if (!teamId) return setError("Club ID is required.");
    if (isNew && teams.data?.some((t) => t.teamId === teamId))
      return setError("A club with this ID already exists.");
    setError(null);
    save.mutate(
      { ...draft, teamId, teamName, updatedAt: new Date().toISOString() },
      { onSuccess: () => setDraft(null), onError: () => setError("Could not save. Try again.") },
    );
  }

  const list = teams.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Clubs" subtitle="Add, edit or remove clubs. Bulk changes go through CSV import." />
        <Button
          onClick={() => {
            setIsNew(true);
            setError(null);
            setDraft(blank());
          }}
        >
          Add club
        </Button>
      </div>

      {teams.isLoading ? <LoadingState label="Loading clubs…" /> : null}
      {!teams.isLoading && list.length === 0 ? <EmptyMessage title="No clubs yet." /> : null}
      {list.length > 0 ? (
        <Card>
          <CardBody className="divide-y divide-border p-2">
            {list.map((team) => (
              <div key={team.teamId} className="flex items-center gap-3 px-2 py-2.5">
                <TeamBadge size="sm" team={{ name: team.teamName, shortName: team.shortName, logo: team.logo }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{team.teamName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {team.teamId} · {team.stadium ?? "No stadium"} · {team.active ? "Active" : "Inactive"}
                  </p>
                </div>
                <RowActions
                  onEdit={() => {
                    setIsNew(false);
                    setError(null);
                    setDraft(team);
                  }}
                  onDelete={() => remove.mutate(team.teamId)}
                />
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <EditorDialog
        open={draft !== null}
        title={isNew ? "Add club" : "Edit club"}
        onClose={() => setDraft(null)}
        onSave={submit}
        saving={save.isPending}
        error={error}
      >
        {draft ? (
          <>
            <Field label="Club name *">
              <input className={inputClass} value={draft.teamName} onChange={(e) => set("teamName", e.target.value)} />
            </Field>
            <Field label={isNew ? "Club ID (leave blank to generate from name)" : "Club ID (fixed)"}>
              <input
                className={inputClass}
                value={draft.teamId}
                disabled={!isNew}
                onChange={(e) => set("teamId", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Short name">
                <input className={inputClass} value={draft.shortName ?? ""} onChange={(e) => set("shortName", text(e.target.value))} />
              </Field>
              <Field label="Country">
                <input className={inputClass} value={draft.country ?? ""} onChange={(e) => set("country", text(e.target.value))} />
              </Field>
            </div>
            <Field label="Stadium">
              <input className={inputClass} value={draft.stadium ?? ""} onChange={(e) => set("stadium", text(e.target.value))} />
            </Field>
            <Field label="Logo URL">
              <input className={inputClass} value={draft.logo ?? ""} onChange={(e) => set("logo", text(e.target.value))} />
            </Field>
            <Field label="SportScore slug (links live stats)">
              <input
                className={inputClass}
                value={draft.sportscoreSlug ?? ""}
                onChange={(e) => set("sportscoreSlug", text(e.target.value))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
              Active this season
            </label>
          </>
        ) : null}
      </EditorDialog>
    </div>
  );
}
