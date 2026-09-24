import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { useFirestore, usePlayers, useTeams } from "@/hooks/useMasterData";
import { cn } from "@/lib/utils";
import {
  buildPlayerPlan,
  buildTeamPlan,
  countIssues,
  parseCsvFile,
  type CsvIssue,
  type ImportPlan,
  type PlayerImportPlan,
} from "@/services/csvImport";
import {
  recordImport,
  recordTransfers,
  upsertPlayers,
  upsertTeams,
} from "@/services/masterDataService";
import { CURRENT_SEASON, type MasterPlayer, type MasterTeam } from "@/types/master";

type Kind = "teams" | "players";

type AnyPlan = ImportPlan<MasterTeam> | PlayerImportPlan;

const isPlayerPlan = (plan: AnyPlan): plan is PlayerImportPlan => "transfers" in plan;

function Summary({ plan }: { plan: AnyPlan }) {
  const { errors, warnings } = countIssues(plan.issues);
  const tiles = [
    { label: "Rows read", value: plan.rowsRead },
    { label: "New", value: plan.created.length },
    { label: "Updated", value: plan.updated.length },
    { label: "Unchanged", value: plan.unchanged.length },
    { label: "Warnings", value: warnings },
    { label: "Errors", value: errors },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-2xl border border-border p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{tile.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}

function IssueList({ issues }: { issues: CsvIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {issues.slice(0, 50).map((issue, index) => (
        <li
          key={`${issue.row}-${issue.field}-${index}`}
          className={cn(
            "rounded-xl border px-3 py-2",
            issue.severity === "error"
              ? "border-destructive/40 text-destructive"
              : "border-border text-muted-foreground",
          )}
        >
          {issue.row ? <span className="font-medium">Row {issue.row}: </span> : null}
          {issue.message}
        </li>
      ))}
      {issues.length > 50 ? (
        <li className="px-3 text-xs text-muted-foreground">
          …and {issues.length - 50} more.
        </li>
      ) : null}
    </ul>
  );
}

function NameList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold">
        {title} ({items.length})
      </h4>
      <p className="mt-1 text-sm text-muted-foreground">{items.slice(0, 30).join(", ")}
        {items.length > 30 ? ` …and ${items.length - 30} more` : ""}
      </p>
    </div>
  );
}

export function DataImportScreen() {
  const { db, uid } = useFirestore();
  const queryClient = useQueryClient();
  const teams = useTeams();
  const players = usePlayers();

  const [kind, setKind] = useState<Kind>("teams");
  const [plan, setPlan] = useState<AnyPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus(null);
    setFailed(null);
    setPlan(null);
    setBusy(true);
    try {
      const { rows, issues } = await parseCsvFile(file);
      const next =
        kind === "teams"
          ? buildTeamPlan(file.name, rows, teams.data ?? [])
          : buildPlayerPlan(file.name, rows, players.data ?? [], teams.data ?? []);
      next.issues.unshift(...issues);
      setPlan(next);
    } catch {
      setFailed("That file could not be read. Check it is a valid CSV export and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!plan || !db || !uid) return;
    const { errors, warnings } = countIssues(plan.issues);
    setBusy(true);
    setFailed(null);
    try {
      const records = [...plan.created, ...plan.updated].map((entry) => entry.record);
      if (isPlayerPlan(plan)) {
        await upsertPlayers(db, records as MasterPlayer[]);
        if (plan.transfers.length > 0) {
          const now = new Date().toISOString();
          await recordTransfers(
            db,
            plan.transfers.map((transfer) => {
              const record = [...plan.created, ...plan.updated].find(
                (entry) => entry.id === transfer.playerId,
              )?.record;
              return {
                transferId: `${transfer.playerId}-${now}`,
                playerId: transfer.playerId,
                playerName: transfer.playerName,
                fromTeamId: "",
                fromTeamName: transfer.from,
                toTeamId: record?.teamId ?? "",
                toTeamName: transfer.to,
                transferDate: now,
                season: record?.season ?? CURRENT_SEASON,
                source: "worldfootball",
                createdAt: now,
              };
            }),
          );
        }
      } else {
        await upsertTeams(db, records as MasterTeam[]);
      }

      const importedAt = new Date().toISOString();
      await recordImport(db, {
        importId: `${kind}-${importedAt}`,
        type: kind,
        fileName: plan.fileName,
        season: CURRENT_SEASON,
        source: "worldfootball",
        recordsRead: plan.rowsRead,
        recordsCreated: plan.created.length,
        recordsUpdated: plan.updated.length,
        recordsSkipped: plan.rowsRead - plan.created.length - plan.updated.length,
        warnings,
        errors,
        importedBy: uid,
        importedAt,
      });

      await queryClient.invalidateQueries({ queryKey: ["master"] });
      setStatus(
        `Imported ${plan.created.length} new and ${plan.updated.length} updated ${kind === "teams" ? "clubs" : "players"}.`,
      );
      setPlan(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setFailed("The import could not be saved. Nothing was changed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const errorCount = plan ? countIssues(plan.issues).errors : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import clubs and players"
        subtitle="Upload a file, review exactly what will change, then confirm. Nothing is saved until you confirm."
      />

      <Card>
        <CardBody className="space-y-4 p-4">
          <div className="flex gap-2">
            {(["teams", "players"] as Kind[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setKind(option);
                  setPlan(null);
                  setStatus(null);
                }}
                className={cn(
                  "rounded-full border border-border px-4 py-2 text-sm font-medium capitalize",
                  kind === option && "bg-foreground text-background",
                )}
              >
                {option === "teams" ? "Clubs file" : "Players file"}
              </button>
            ))}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            aria-label={kind === "teams" ? "Choose the clubs file" : "Choose the players file"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium"
          />

          <p className="text-sm text-muted-foreground">
            {kind === "teams"
              ? "Required columns: team_id, team_name."
              : "Required columns: player_id, player_name, team_id, team_name, position. Clubs must be imported first."}
          </p>

          {busy ? <p className="text-sm text-muted-foreground">Working…</p> : null}
          {status ? <p className="text-sm font-medium">{status}</p> : null}
          {failed ? <p className="text-sm font-medium text-destructive">{failed}</p> : null}
        </CardBody>
      </Card>

      {plan ? (
        <Card>
          <CardBody className="space-y-4 p-4">
            <h2 className="text-lg font-semibold">Preview — {plan.fileName}</h2>
            <Summary plan={plan} />

            <NameList
              title={kind === "teams" ? "New clubs" : "New players"}
              items={plan.created.map((entry) => entry.label)}
            />
            <NameList
              title="Updated records"
              items={plan.updated.map(
                (entry) => `${entry.label} (${entry.changes.map((change) => change.field).join(", ")})`,
              )}
            />
            {isPlayerPlan(plan) ? (
              <>
                <NameList
                  title="Club changes"
                  items={plan.transfers.map((t) => `${t.playerName}: ${t.from} → ${t.to}`)}
                />
                <NameList
                  title="Position changes"
                  items={plan.positionChanges.map((p) => `${p.playerName}: ${p.from} → ${p.to}`)}
                />
              </>
            ) : null}
            <NameList
              title="Existing records not found in this file (kept, review manually)"
              items={plan.missingFromFile.map((entry) => entry.label)}
            />

            {plan.issues.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold">Warnings and errors</h4>
                <IssueList issues={plan.issues} />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button onClick={() => void confirmImport()} disabled={busy}>
                {busy ? "Importing…" : "Confirm import"}
              </Button>
              <Button variant="ghost" onClick={() => setPlan(null)} disabled={busy}>
                Cancel
              </Button>
              {errorCount > 0 ? (
                <span className="text-sm text-muted-foreground">
                  {errorCount} row{errorCount === 1 ? "" : "s"} will be skipped because of errors.
                </span>
              ) : null}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
