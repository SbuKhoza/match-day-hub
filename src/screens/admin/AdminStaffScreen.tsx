import { useMemo, useState } from "react";

import { EditorDialog, Field, RowActions, inputClass, slugId } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdminAction } from "@/hooks/useAdmin";
import { useFirestore, useStaff, useTeams } from "@/hooks/useMasterData";
import { deleteStaff, saveStaff } from "@/services/adminService";
import {
  CURRENT_SEASON,
  STAFF_ROLES,
  normalizeName,
  type MasterStaff,
  type StaffRole,
} from "@/types/master";

const blank = (): MasterStaff => {
  const now = new Date().toISOString();
  return {
    staffId: "",
    fullName: "",
    fullNameNormalized: "",
    teamId: "",
    teamName: "",
    role: "Head Coach",
    roleRaw: null,
    nationality: null,
    dateOfBirth: null,
    photoUrl: null,
    season: CURRENT_SEASON,
    active: true,
    source: "manual",
    createdAt: now,
    updatedAt: now,
  };
};

export function AdminStaffScreen() {
  const { db } = useFirestore();
  const staff = useStaff();
  const teams = useTeams();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [draft, setDraft] = useState<MasterStaff | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useAdminAction((s: MasterStaff) => saveStaff(db!, s), [["master"]]);
  const remove = useAdminAction((id: string) => deleteStaff(db!, id), [["master"]]);

  const set = <K extends keyof MasterStaff>(key: K, value: MasterStaff[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  const text = (value: string) => (value.trim() ? value.trim() : null);

  const list = useMemo(() => {
    const key = normalizeName(search);
    return (staff.data ?? []).filter(
      (s) =>
        (!teamFilter || s.teamId === teamFilter) &&
        (!roleFilter || s.role === roleFilter) &&
        (!key || s.fullNameNormalized.includes(key)),
    );
  }, [staff.data, search, teamFilter, roleFilter]);

  function open(member: MasterStaff, fresh: boolean) {
    setIsNew(fresh);
    setError(null);
    setDraft(member);
  }

  function submit() {
    if (!draft) return;
    const fullName = draft.fullName.trim();
    if (!fullName) return setError("Name is required.");
    const team = teams.data?.find((t) => t.teamId === draft.teamId);
    if (!team) return setError("Choose a club.");
    if (!draft.role) return setError("Choose a role.");
    if (draft.role === "Other" && !draft.roleRaw?.trim())
      return setError('Give a title for "Other".');
    const staffId = isNew
      ? draft.staffId.trim() || `${slugId(fullName)}-${Date.now().toString(36)}`
      : draft.staffId;
    if (isNew && staff.data?.some((s) => s.staffId === staffId))
      return setError("A staff member with this ID already exists.");
    setError(null);
    save.mutate(
      {
        ...draft,
        staffId,
        fullName,
        fullNameNormalized: normalizeName(fullName),
        teamName: team.teamName,
        roleRaw: draft.role === "Other" ? draft.roleRaw?.trim() || null : null,
        updatedAt: new Date().toISOString(),
      },
      { onSuccess: () => setDraft(null), onError: () => setError("Could not save. Try again.") },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Technical staff"
          subtitle="Managers, coaches and other non-playing club staff."
        />
        <Button onClick={() => open(blank(), true)} disabled={(teams.data ?? []).length === 0}>
          Add staff member
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Search staff"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${inputClass} max-w-xs`}
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          <option value="">All clubs</option>
          {(teams.data ?? []).map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.teamName}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} max-w-xs`}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          {STAFF_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {staff.isLoading ? <LoadingState label="Loading staff…" /> : null}
      {!staff.isLoading && list.length === 0 ? (
        <EmptyMessage
          title="No staff found."
          {...((teams.data ?? []).length === 0 ? { description: "Add a club first." } : {})}
        />
      ) : null}
      {list.length > 0 ? (
        <Card>
          <CardBody className="divide-y divide-border p-2">
            {list.slice(0, 200).map((member) => (
              <div key={member.staffId} className="flex items-center gap-3 px-2 py-2.5">
                <span className="w-32 shrink-0 text-xs font-semibold text-muted-foreground">
                  {member.role === "Other" ? (member.roleRaw ?? "Other") : member.role}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.teamName} · {member.active ? "Active" : "Inactive"}
                  </p>
                </div>
                <RowActions
                  onEdit={() => open(member, false)}
                  onDelete={() => remove.mutate(member.staffId)}
                />
              </div>
            ))}
            {list.length > 200 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                Showing 200 of {list.length}. Narrow the search.
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <EditorDialog
        open={draft !== null}
        title={isNew ? "Add staff member" : "Edit staff member"}
        onClose={() => setDraft(null)}
        onSave={submit}
        saving={save.isPending}
        error={error}
      >
        {draft ? (
          <>
            <Field label="Full name *">
              <input
                className={inputClass}
                value={draft.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Club *">
                <select
                  className={inputClass}
                  value={draft.teamId}
                  onChange={(e) => set("teamId", e.target.value)}
                >
                  <option value="">Select a team</option>
                  {(teams.data ?? []).map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Role *">
                <select
                  className={inputClass}
                  value={draft.role}
                  onChange={(e) => set("role", e.target.value as StaffRole)}
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              {draft.role === "Other" ? (
                <Field label="Title (for “Other”) *">
                  <input
                    className={inputClass}
                    value={draft.roleRaw ?? ""}
                    onChange={(e) => set("roleRaw", text(e.target.value))}
                  />
                </Field>
              ) : null}
              <Field label="Nationality">
                <input
                  className={inputClass}
                  value={draft.nationality ?? ""}
                  onChange={(e) => set("nationality", text(e.target.value))}
                />
              </Field>
              <Field label="Date of birth">
                <input
                  type="date"
                  className={inputClass}
                  value={draft.dateOfBirth ?? ""}
                  onChange={(e) => set("dateOfBirth", text(e.target.value))}
                />
              </Field>
              <Field label="Photo URL">
                <input
                  className={inputClass}
                  value={draft.photoUrl ?? ""}
                  onChange={(e) => set("photoUrl", text(e.target.value))}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Active this season
            </label>
            {!isNew ? (
              <p className="text-xs text-muted-foreground">
                Staff ID {draft.staffId} stays the same after club changes.
              </p>
            ) : null}
          </>
        ) : null}
      </EditorDialog>
    </div>
  );
}