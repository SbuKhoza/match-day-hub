import { useEffect, useState } from "react";

import { Field, inputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdminAction, useFantasySettings } from "@/hooks/useAdmin";
import { useFirestore } from "@/hooks/useMasterData";
import { saveFantasySettings } from "@/services/adminService";
import { formatRand } from "@/utils/format";

export function AdminSettingsScreen() {
  const { db } = useFirestore();
  const { settings, isLoading } = useFantasySettings();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const save = useAdminAction((budget: number) => saveFantasySettings(db!, budget), [["settings"]]);

  useEffect(() => {
    if (!isLoading) setValue(String(settings.budget / 1_000_000));
  }, [isLoading, settings.budget]);

  function submit() {
    const millions = Number(value);
    if (!Number.isFinite(millions) || millions <= 0) return setMessage("Enter a positive amount in millions.");
    save.mutate(Math.round(millions * 1_000_000), {
      onSuccess: () => setMessage("Budget saved. Players will see it straight away."),
      onError: () => setMessage("Could not save. Try again."),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Fantasy settings" subtitle="Rules that apply to every player's squad." />
      <Card>
        <CardBody className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">
            Current squad budget: <span className="font-semibold text-foreground">{formatRand(settings.budget)}</span>
          </p>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="w-48">
              <Field label="Squad budget (R millions)">
                <input className={inputClass} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
              </Field>
            </div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save budget"}
            </Button>
          </form>
          {message ? <p className="text-sm font-medium">{message}</p> : null}
          <p className="text-xs text-muted-foreground">
            Lowering the budget does not remove existing squads, but managers over the new limit must fix their squad
            before saving changes.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
