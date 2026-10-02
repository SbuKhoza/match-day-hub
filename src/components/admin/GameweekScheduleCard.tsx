import { useState } from "react";

import { Field, inputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { useAdminAction } from "@/hooks/useAdmin";
import { useGameweeks } from "@/hooks/useFantasy";
import { useFirestore } from "@/hooks/useMasterData";
import {
  gameweekDeadline,
  saveGameweek,
  type GameweekInput,
} from "@/services/gameweekService";
import type { Gameweek } from "@/types/fantasy";
import { formatKickoff } from "@/utils/format";

/** `datetime-local` value ("YYYY-MM-DDTHH:mm", local time) from an ISO string. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Gameweek schedule. Admins enter the first kick-off of each gameweek; the manager deadline is
 * automatically one hour before it.
 */
export function GameweekScheduleCard() {
  const { db } = useFirestore();
  const { data: gameweeks = [] } = useGameweeks();
  const [number, setNumber] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [status, setStatus] = useState<Gameweek["status"]>("upcoming");
  const [message, setMessage] = useState<string | null>(null);
  const save = useAdminAction((input: GameweekInput) => saveGameweek(db!, input), [
    ["fantasy", "gameweeks"],
    ["fantasy", "gameweek"],
  ]);

  const previewDeadline =
    kickoff && !Number.isNaN(new Date(kickoff).getTime())
      ? formatKickoff(new Date(new Date(kickoff).getTime() - 60 * 60 * 1000).toISOString())
      : null;

  function edit(gw: Gameweek) {
    setNumber(String(gw.number));
    setKickoff(toLocalInput(gw.firstKickoff ?? gw.deadline));
    setStatus(gw.status);
    setMessage(null);
  }

  function submit() {
    const n = Number(number);
    if (!Number.isInteger(n) || n < 1) return setMessage("Enter a gameweek number (1 or higher).");
    if (!kickoff) return setMessage("Enter the first kick-off date and time.");
    save.mutate(
      { number: n, firstKickoff: new Date(kickoff).toISOString(), status },
      {
        onSuccess: () => setMessage(`Gameweek ${n} saved.`),
        onError: (e) => setMessage(e instanceof Error ? e.message : "Could not save. Try again."),
      },
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">Gameweek deadlines</h2>
          <p className="text-sm text-muted-foreground">
            Enter the first kick-off of each gameweek. Managers are locked out one hour earlier and
            can only change their team for the next gameweek.
          </p>
        </div>

        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="w-28">
            <Field label="Gameweek">
              <input className={inputClass} inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} />
            </Field>
          </div>
          <div className="w-56">
            <Field label="First kick-off">
              <input type="datetime-local" className={inputClass} value={kickoff} onChange={(e) => setKickoff(e.target.value)} />
            </Field>
          </div>
          <div className="w-36">
            <Field label="Status">
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as Gameweek["status"])}>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="finished">Finished</option>
              </select>
            </Field>
          </div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save gameweek"}
          </Button>
        </form>
        {previewDeadline ? (
          <p className="text-xs text-muted-foreground">Deadline will be {previewDeadline}.</p>
        ) : null}
        {message ? <p className="text-sm font-medium">{message}</p> : null}

        {gameweeks.length > 0 ? (
          <ul className="space-y-2">
            {[...gameweeks].reverse().map((gw) => {
              const deadline = gameweekDeadline(gw);
              return (
                <li
                  key={gw.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span className="font-semibold">GW {gw.number}</span>
                  <span className="text-muted-foreground">
                    Deadline {deadline ? formatKickoff(new Date(deadline).toISOString()) : "—"} · {gw.status}
                  </span>
                  <Button size="sm" variant="ghost" type="button" onClick={() => edit(gw)}>
                    Edit
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No gameweeks scheduled yet.</p>
        )}
      </CardBody>
    </Card>
  );
}