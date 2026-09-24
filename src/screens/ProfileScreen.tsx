import { Link, useNavigate } from "@tanstack/react-router";
import { Check, LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { TeamBadge } from "@/components/common/TeamBadge";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useMasterData";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { initials } from "@/utils/format";

export function ProfileScreen() {
  const { profile, user, logout, saveFavoriteTeam, savePreferredTheme } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: teams, isLoading } = useTeams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState<string | null>(null);
  const [teamStatus, setTeamStatus] = useState<string | null>(null);

  const name = profile?.name ?? user?.displayName ?? "Guest";
  const clubs = teams ?? [];
  const favorite = clubs.find((team) => team.teamId === profile?.favoriteTeam) ?? null;

  async function handleTeamChange(teamId: string) {
    if (saving) return;
    setSaving(teamId);
    setTeamStatus(null);
    try {
      await saveFavoriteTeam(teamId);
      const club = clubs.find((team) => team.teamId === teamId);
      setTeamStatus(`Saved — ${club?.teamName ?? "your club"} is now your club.`);
    } catch {
      setTeamStatus("Couldn't save your team. Check your connection and try again.");
    } finally {
      setSaving(null);
    }
  }

  async function handleThemeChange(next: "light" | "dark") {
    setTheme(next);
    await savePreferredTheme(next).catch(() => undefined);
  }

  async function handleLogout() {
    await logout();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your account, club and appearance." />

      <Card>
        <CardBody className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-lg font-semibold">
            {initials(name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold">{name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {profile?.email ?? user?.email}
            </p>
          </div>
          {favorite ? (
            <TeamBadge
              team={{ name: favorite.teamName, shortName: favorite.shortName, logo: favorite.logo }}
              size="lg"
            />
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">Appearance</h2>
          <div className="mt-4 flex gap-3">
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleThemeChange(option)}
                className={cn(
                  "flex-1 rounded-2xl border border-border px-4 py-4 text-sm font-medium capitalize transition-colors",
                  theme === option ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                )}
              >
                {option} theme
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">Favourite team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {saving
              ? "Saving…"
              : (teamStatus ?? "Tap a club to update your personalised feed.")}
          </p>
          <div className="mt-4">
            {isLoading ? <LoadingState label="Loading clubs…" /> : null}
            {!isLoading && clubs.length === 0 ? (
              <EmptyMessage title="No clubs have been imported yet." />
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((team) => (
                <button
                  key={team.teamId}
                  type="button"
                  onClick={() => handleTeamChange(team.teamId)}
                  disabled={saving !== null}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-secondary disabled:opacity-60",
                    profile?.favoriteTeam === team.teamId && "ring-2 ring-foreground",
                  )}
                >
                  <TeamBadge
                    team={{ name: team.teamName, shortName: team.shortName, logo: team.logo }}
                    size="sm"
                  />
                  <span className="min-w-0 truncate text-sm font-medium">{team.teamName}</span>
                  {profile?.favoriteTeam === team.teamId ? (
                    <Check className="ml-auto h-4 w-4 shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {isAdmin ? (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">Data management</h2>
              <p className="text-sm text-muted-foreground">
                Import the clubs and players files and review past imports.
              </p>
            </div>
            <Link
              to="/admin"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Open
            </Link>
          </CardBody>
        </Card>
      ) : null}

      <Button variant="outline" size="lg" block onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  );
}