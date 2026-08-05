import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, CalendarClock, Trophy, Users, Wallet, Star } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { StatTile } from "@/components/fantasy/StatTile";
import { useFantasyTeam, useGameweek, useLeagues, usePlayerPoints, useTransfers } from "@/hooks/useFantasy";
import { calculateGameweek, calculateOverall } from "@/services/scoringService";
import { SQUAD_RULES } from "@/types/fantasy";
import { formatKickoff, formatRand } from "@/utils/format";

const LINKS = [
  { to: "/fantasy/team", label: "My Team", icon: Users, hint: "Build and manage your squad" },
  { to: "/fantasy/leagues", label: "My Leagues", icon: Trophy, hint: "Create, join and compare" },
  { to: "/fantasy/transfers", label: "Transfers", icon: ArrowLeftRight, hint: "Swap players in and out" },
  { to: "/fantasy/points", label: "Points", icon: Star, hint: "Gameweek and overall scoring" },
] as const;

export function FantasyScreen() {
  const { data: team, isLoading } = useFantasyTeam();
  const { data: leagues } = useLeagues();
  const { data: gameweek } = useGameweek();
  const { data: transfers } = useTransfers();
  const { data: points } = usePlayerPoints();

  const gw = gameweek?.number ?? 0;
  const gwResult = team && points ? calculateGameweek(team, points, gw) : null;
  const overall = team && points ? calculateOverall(team, points) : 0;
  const remaining = SQUAD_RULES.budget - (team?.budgetSpent ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Fantasy" subtitle="Your squad, leagues, transfers and points." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Gameweek points" value={String(gwResult?.total ?? 0)} icon={Trophy} hint={`GW ${gw}`} />
        <StatTile label="Overall points" value={String(overall)} icon={Star} />
        <StatTile label="Budget left" value={formatRand(remaining)} icon={Wallet} />
        <StatTile label="Mini-leagues" value={String(leagues?.length ?? 0)} icon={Users} />
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Gameweek {gw}</p>
            <p className="text-xs text-muted-foreground">
              {gameweek ? `Deadline ${formatKickoff(gameweek.deadline)}` : "Loading fixtures…"}
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium capitalize">
            {gameweek?.status ?? "—"}
          </span>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">My team</h2>
          {isLoading ? (
            <div className="mt-4 h-28 animate-pulse rounded-2xl bg-muted" />
          ) : team ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{team.name}</p>
                <p className="text-xs text-muted-foreground">
                  {team.squad.length} players · {team.starters.length} starting ·{" "}
                  {formatRand(team.budgetSpent)} spent
                </p>
              </div>
              <Link
                to="/fantasy/team"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                Manage squad
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Users}
                title="No squad yet"
                description="Pick 17 players inside your R100.0m budget to enter this season."
                action={
                  <Link
                    to="/fantasy/team"
                    className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    Build my team
                  </Link>
                }
              />
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 rounded-2xl border border-border p-4 transition-colors hover:bg-secondary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
              <link.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{link.label}</span>
              <span className="block text-xs text-muted-foreground">{link.hint}</span>
            </span>
          </Link>
        ))}
      </div>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">Recent transfers</h2>
          {transfers && transfers.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {transfers.slice(0, 5).map((transfer) => (
                <li key={transfer.id} className="rounded-2xl border border-border px-3 py-2">
                  GW {transfer.gameweek}: {transfer.outPlayerId} → {transfer.inPlayerId}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={ArrowLeftRight}
                title="No transfers yet"
                description="Transfers you make will appear here with the gameweek they were used in."
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
