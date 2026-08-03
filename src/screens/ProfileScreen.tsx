import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { TeamBadge } from "@/components/common/TeamBadge";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { TEAMS, getTeam } from "@/services/mockData";
import { initials } from "@/utils/format";

export function ProfileScreen() {
  const { profile, user, logout, saveFavoriteTeam, savePreferredTheme } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const name = profile?.name ?? user?.displayName ?? "Guest";
  const favorite = getTeam(profile?.favoriteTeam);

  async function handleTeamChange(teamId: string) {
    setSaving(true);
    try {
      await saveFavoriteTeam(teamId);
    } finally {
      setSaving(false);
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
          {favorite ? <TeamBadge team={favorite} size="lg" /> : null}
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
            {saving ? "Saving…" : "Tap a club to update your personalised feed."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEAMS.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => handleTeamChange(team.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-secondary",
                  profile?.favoriteTeam === team.id && "ring-2 ring-foreground",
                )}
              >
                <TeamBadge team={team} size="sm" />
                <span className="min-w-0 truncate text-sm font-medium">{team.name}</span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Button variant="outline" size="lg" block onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  );
}