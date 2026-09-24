import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/Button";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { TeamBadge } from "@/components/common/TeamBadge";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useMasterData";
import { cn } from "@/lib/utils";

export function OnboardingScreen() {
  const { user, loading, saveFavoriteTeam } = useAuth();
  const { data: teams, isLoading } = useTeams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  async function handleContinue() {
    if (!selected) return;
    setBusy(true);
    try {
      await saveFavoriteTeam(selected);
      navigate({ to: "/", replace: true });
    } finally {
      setBusy(false);
    }
  }

  const clubs = teams ?? [];

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-sm text-muted-foreground">Step 1 of 1</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Pick your club</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll personalise your home feed, fixtures and news around this team.
        </p>

        <div className="mt-8">
          {isLoading ? <LoadingState label="Loading clubs…" /> : null}
          {!isLoading && clubs.length === 0 ? (
            <EmptyMessage
              title="No clubs have been imported yet."
              description="You can continue and choose your club later, once the club list is available."
              action={
                <Button size="lg" onClick={() => navigate({ to: "/", replace: true })}>
                  Skip for now
                </Button>
              }
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((team) => {
              const active = selected === team.teamId;
              return (
                <button
                  key={team.teamId}
                  type="button"
                  onClick={() => setSelected(team.teamId)}
                  className={cn(
                    "card-surface flex items-center gap-4 p-5 text-left transition-all hover:shadow-lifted",
                    active && "ring-2 ring-foreground",
                  )}
                >
                  <TeamBadge
                    team={{ name: team.teamName, shortName: team.shortName, logo: team.logo }}
                    size="lg"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold">{team.teamName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {team.stadium ?? team.country ?? ""}
                    </span>
                  </span>
                  {active ? <Check className="h-5 w-5" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {clubs.length > 0 ? (
          <div className="sticky bottom-4 mt-8">
            <Button size="lg" block disabled={!selected || busy} onClick={handleContinue}>
              {busy ? "Saving…" : "Continue"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}