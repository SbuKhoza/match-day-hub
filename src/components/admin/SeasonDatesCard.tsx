import { useEffect, useState } from "react";

import { Field, inputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { useAdminAction, useFantasySettings } from "@/hooks/useAdmin";
import { useFirestore } from "@/hooks/useMasterData";
import { saveSeasonDates, validateSeasonDates, type SeasonDates } from "@/services/adminService";

/**
 * Season start, season end and the start of the second half. The second-half date decides which
 * half each gameweek belongs to, which controls the once-per-half Double Captain and Bench Boost.
 */
export function SeasonDatesCard() {
  const { db } = useFirestore();
  const { settings, isLoading } = useFantasySettings();
  const [dates, setDates] = useState<SeasonDates>({ seasonStart: "", seasonEnd: "", secondHalfStart: "" });
  const [message, setMessage] = useState<string | null>(null);
  const save = useAdminAction((value: SeasonDates) => saveSeasonDates(db!, value), [["settings"]]);

  useEffect(() => {
    if (isLoading) return;
    setDates({
      seasonStart: settings.seasonStart ?? "",
      seasonEnd: settings.seasonEnd ?? "",
      secondHalfStart: settings.secondHalfStart ?? "",
    });
  }, [isLoading, settings.seasonStart, settings.seasonEnd, settings.secondHalfStart]);

  function update(key: keyof SeasonDates, value: string) {
    setMessage(null);
    setDates((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const error = validateSeasonDates(dates);
    if (error) return setMessage(error);
    save.mutate(dates, {
      onSuccess: () => setMessage("Season dates saved."),
      onError: (e) => setMessage(e instanceof Error ? e.message : "Could not save. Try again."),
    });
  }

  return (
    <Card>
      <CardBody className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">Season dates</h2>
          <p className="text-sm text-muted-foreground">
            The second half decides which gameweeks count as the first or second half for chips.
          </p>
        </div>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="w-44">
            <Field label="Season start">
              <input type="date" className={inputClass} value={dates.seasonStart} onChange={(e) => update("seasonStart", e.target.value)} />
            </Field>
          </div>
          <div className="w-44">
            <Field label="Second half starts">
              <input type="date" className={inputClass} value={dates.secondHalfStart} onChange={(e) => update("secondHalfStart", e.target.value)} />
            </Field>
          </div>
          <div className="w-44">
            <Field label="Season end">
              <input type="date" className={inputClass} value={dates.seasonEnd} onChange={(e) => update("seasonEnd", e.target.value)} />
            </Field>
          </div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save dates"}
          </Button>
        </form>
        {message ? <p className="text-sm font-medium">{message}</p> : null}
      </CardBody>
    </Card>
  );
}