import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/Button";
import { TeamBadge } from "@/components/common/TeamBadge";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { TEAMS } from "@/services/mockData";

export function OnboardingScreen() {
  const { user, loading, saveFavoriteTeam } = useAuth();
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

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-sm text-muted-foreground">Step 1 of 1</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Pick your club</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll personalise your home feed, fixtures and news around this team.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAMS.map((team) => {
            const active = selected === team.id;
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelected(team.id)}
                className={cn(
                  "card-surface flex items-center gap-4 p-5 text-left transition-all hover:shadow-lifted",
                  active && "ring-2 ring-foreground",
                )}
              >
                <TeamBadge team={team} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold">{team.name}</span>
                  <span className="block text-xs text-muted-foreground">{team.league}</span>
                </span>
                {active ? <Check className="h-5 w-5" /> : null}
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-8">
          <Button size="lg" block disabled={!selected || busy} onClick={handleContinue}>
            {busy ? "Saving…" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}