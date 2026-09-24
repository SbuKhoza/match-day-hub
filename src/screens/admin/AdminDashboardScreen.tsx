import { Link } from "@tanstack/react-router";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/fantasy/StatTile";
import { useImportHistory, usePlayers, useTeams } from "@/hooks/useMasterData";

export function AdminDashboardScreen() {
  const teams = useTeams();
  const players = usePlayers();
  const imports = useImportHistory();

  const history = imports.data ?? [];
  const lastImport = history[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data management"
        subtitle="Clubs and players come from the WorldFootball export. Match statistics come from SportScore."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Clubs imported" value={String(teams.data?.length ?? 0)} />
        <StatTile label="Players imported" value={String(players.data?.length ?? 0)} />
        <StatTile
          label="Last import"
          value={lastImport ? new Date(lastImport.importedAt).toLocaleDateString() : "Never"}
          {...(lastImport ? { hint: lastImport.fileName } : {})}
        />
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">Import clubs and players</h2>
            <p className="text-sm text-muted-foreground">
              Upload the teams and players files, review the changes, then confirm.
            </p>
          </div>
          <Link
            to="/admin/import"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Open importer
          </Link>
        </CardBody>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Import history</h2>
        {imports.isLoading ? <LoadingState label="Loading history…" /> : null}
        {!imports.isLoading && history.length === 0 ? (
          <EmptyMessage title="Nothing has been imported yet." />
        ) : null}
        {history.length > 0 ? (
          <Card>
            <CardBody className="overflow-x-auto p-4">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-medium">When</th>
                    <th scope="col" className="py-2 pr-3 font-medium">File</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Type</th>
                    <th scope="col" className="py-2 pr-2 text-right font-medium">Read</th>
                    <th scope="col" className="py-2 pr-2 text-right font-medium">New</th>
                    <th scope="col" className="py-2 pr-2 text-right font-medium">Updated</th>
                    <th scope="col" className="py-2 pr-2 text-right font-medium">Skipped</th>
                    <th scope="col" className="py-2 text-right font-medium">Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.importId} className="border-t border-border">
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {new Date(entry.importedAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-3 font-medium">{entry.fileName}</td>
                      <td className="py-2.5 pr-3">{entry.type}</td>
                      <td className="py-2.5 pr-2 text-right tabular-nums">{entry.recordsRead}</td>
                      <td className="py-2.5 pr-2 text-right tabular-nums">{entry.recordsCreated}</td>
                      <td className="py-2.5 pr-2 text-right tabular-nums">{entry.recordsUpdated}</td>
                      <td className="py-2.5 pr-2 text-right tabular-nums">{entry.recordsSkipped}</td>
                      <td className="py-2.5 text-right tabular-nums">{entry.warnings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
