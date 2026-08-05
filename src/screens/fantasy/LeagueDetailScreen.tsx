import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Copy, LogOut, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { LeagueTable, type LeagueTableRow } from "@/components/fantasy/LeagueTable";
import { useFantasyDb, useGameweek, useLeague, usePlayerPoints, useTransfers } from "@/hooks/useFantasy";
import { leaveLeague } from "@/services/fantasyService";
import { getPlayer } from "@/services/playerPool";
import { calculateGameweek, calculateOverall } from "@/services/scoringService";

export function LeagueDetailScreen({ leagueId }: { leagueId: string }) {
  const { db, uid } = useFantasyDb();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useLeague(leagueId);
  const { data: gameweek } = useGameweek();
  const { data: points = [] } = usePlayerPoints();
  const { data: transfers = [] } = useTransfers();
  const [copied, setCopied] = useState(false);

  const gw = gameweek?.number ?? 0;

  const leave = useMutation({
    mutationFn: async () => {
      if (!db || !uid) throw new Error("Sign in first.");
      await leaveLeague(db, uid, leagueId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fantasy", "leagues", uid] });
      navigate({ to: "/fantasy/leagues" });
    },
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  if (!data) {
    return (
      <EmptyState icon={Users} title="League not found" description="This league may have been deleted." />
    );
  }

  const { league, teams } = data;

  const rows: LeagueTableRow[] = teams
    .map((team) => ({
      uid: team.uid,
      name: team.name,
      gameweekPoints: calculateGameweek(team, points, gw).total,
      totalPoints: calculateOverall(team, points),
      captain: team.captainId ? (getPlayer(team.captainId)?.name ?? "—") : "—",
      transfers: team.uid === uid ? transfers.length : 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.gameweekPoints - a.gameweekPoints);

  return (
    <div className="space-y-6">
      <PageHeader title={league.name} subtitle={`${league.memberUids.length} members · Gameweek ${gw}`} />

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Invite code</p>
            <p className="text-xl font-semibold tracking-widest">{league.code}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(league.code).catch(() => undefined);
              setCopied(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Share"}
          </button>
          {league.ownerUid !== uid ? (
            <Button variant="outline" onClick={() => leave.mutate()} disabled={leave.isPending}>
              <LogOut className="h-4 w-4" />
              Leave
            </Button>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">League table</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly and overall points, captain picks and transfers made.
          </p>
          <div className="mt-4">
            {rows.length > 0 ? (
              <LeagueTable rows={rows} currentUid={uid ?? undefined} />
            ) : (
              <EmptyState
                icon={Users}
                title="No squads yet"
                description="Table fills up as members save their fantasy teams."
              />
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
