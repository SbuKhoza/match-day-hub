import { useMemo, useState } from "react";

import { EditorDialog, Field, inputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdminAction, useAdminUsers } from "@/hooks/useAdmin";
import { useFirestore, useTeams } from "@/hooks/useMasterData";
import { deleteUserData, updateUser, type ManagedUser } from "@/services/adminService";

export function AdminUsersScreen() {
  const { db, uid: me } = useFirestore();
  const users = useAdminUsers();
  const teams = useTeams();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<ManagedUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const keys = [["admin", "users"]];
  const update = useAdminAction(
    (u: ManagedUser) => updateUser(db!, u.uid, { name: u.name, favoriteTeam: u.favoriteTeam, disabled: u.disabled }),
    keys,
  );
  const remove = useAdminAction((uid: string) => deleteUserData(db!, uid), keys);

  const teamName = (id: string | null) => teams.data?.find((t) => t.teamId === id)?.teamName ?? "—";
  const list = useMemo(() => {
    const q = search.toLowerCase();
    return (users.data ?? [])
      .filter((u) => u.uid !== me)
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users.data, search, me]);

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="View, edit, suspend or remove fan accounts." />
      <input className={`${inputClass} max-w-xs`} placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />

      {users.isLoading ? <LoadingState label="Loading users…" /> : null}
      {users.isError ? <EmptyMessage title="Users could not be loaded." description="Check the updated security rules are published." /> : null}
      {!users.isLoading && !users.isError && list.length === 0 ? <EmptyMessage title="No users found." /> : null}
      {list.length > 0 ? (
        <Card>
          <CardBody className="divide-y divide-border p-2">
            {list.map((u) => (
              <div key={u.uid} className="flex flex-wrap items-center gap-3 px-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {u.name || "Unnamed"}
                    {u.disabled ? <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px]">Suspended</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.email} · {teamName(u.favoriteTeam)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setError(null); setDraft(u); }}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => update.mutate({ ...u, disabled: !u.disabled })}>
                    {u.disabled ? "Reinstate" : "Suspend"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm("Delete this user's profile and fantasy squad? This cannot be undone.")) remove.mutate(u.uid);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Deleting removes the profile and squad. The sign-in account itself can only be removed from the Firebase console.
      </p>

      <EditorDialog
        open={draft !== null}
        title="Edit user"
        onClose={() => setDraft(null)}
        onSave={() => {
          if (!draft) return;
          update.mutate(draft, { onSuccess: () => setDraft(null), onError: () => setError("Could not save. Try again.") });
        }}
        saving={update.isPending}
        error={error}
      >
        {draft ? (
          <>
            <Field label="Name">
              <input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Favourite club">
              <select
                className={inputClass}
                value={draft.favoriteTeam ?? ""}
                onChange={(e) => setDraft({ ...draft, favoriteTeam: e.target.value || null })}
              >
                <option value="">None</option>
                {(teams.data ?? []).map((t) => (
                  <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.disabled} onChange={(e) => setDraft({ ...draft, disabled: e.target.checked })} />
              Suspended
            </label>
          </>
        ) : null}
      </EditorDialog>
    </div>
  );
}
