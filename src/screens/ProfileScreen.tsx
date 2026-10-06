import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Heart, LogOut, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { TeamBadge } from "@/components/common/TeamBadge";
import { FantasySectionHead } from "@/components/fantasy/FantasySectionHead";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, useTeams } from "@/hooks/useMasterData";
import { cn } from "@/lib/utils";
import { initials } from "@/utils/format";

export function ProfileScreen() {
  const { profile, user, logout, saveFavoriteTeam } = useAuth();
  const { data: teams, isLoading } = useTeams();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [saving, setSaving] = useState<string | null>(null);
  const [teamStatus, setTeamStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const name = profile?.name ?? user?.displayName ?? "Guest";
  const clubs = teams ?? [];
  const visibleClubs = clubs.filter((team) =>
    team.teamName.toLowerCase().includes(search.trim().toLowerCase()),
  );
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

  async function handleLogout() {
    await logout();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="-mt-3 space-y-5 sm:-mt-4">
      <h1 className="text-xl font-bold">Profile</h1>

      {/* Account */}
      <section className="home-card relative overflow-hidden">
        <div className="relative flex items-center gap-4 p-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xl font-bold ring-1 ring-white/10">
            {initials(name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold leading-tight">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.email ?? user?.email}
            </p>
            {favorite ? (
              <p className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-xs font-medium ring-1 ring-white/10">
                <TeamBadge
                  team={{ name: favorite.teamName, shortName: favorite.shortName, logo: favorite.logo }}
                  size="sm"
                />
                <span className="truncate">{favorite.teamName}</span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No favourite club yet</p>
            )}
          </div>
        </div>
      </section>

      {/* Favourite club */}
      <section>
        <FantasySectionHead title="Favourite club" icon={Heart} />
        <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
          {saving ? "Saving…" : (teamStatus ?? "Tap a club to update your personalised feed.")}
        </p>

        {clubs.length > 8 ? (
          <label className="home-card mb-3 flex items-center gap-2 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clubs"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        ) : null}

        {isLoading ? <LoadingState label="Loading clubs…" /> : null}
        {!isLoading && clubs.length === 0 ? (
          <EmptyMessage title="No clubs have been imported yet." />
        ) : null}
        {!isLoading && clubs.length > 0 && visibleClubs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No clubs match your search.</p>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {visibleClubs.map((team) => {
            const selected = profile?.favoriteTeam === team.teamId;
            return (
              <button
                key={team.teamId}
                type="button"
                onClick={() => handleTeamChange(team.teamId)}
                disabled={saving !== null}
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl bg-white/[0.04] p-3 text-left ring-1 ring-white/10 transition-colors hover:bg-white/[0.08] disabled:opacity-60",
                  selected && "bg-primary/15 ring-primary/60",
                )}
              >
                <TeamBadge
                  team={{ name: team.teamName, shortName: team.shortName, logo: team.logo }}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{team.teamName}</span>
                {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* Admin shortcut */}
      {isAdmin ? (
        <Link
          to="/admin"
          className="home-card flex items-center gap-3 p-3.5 transition-colors hover:bg-white/[0.07]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Admin</span>
            <span className="block text-xs text-muted-foreground">
              Manage data, content, branding and settings.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      ) : null}

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] py-3 text-sm font-semibold text-red-400 ring-1 ring-white/10 transition-colors hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}