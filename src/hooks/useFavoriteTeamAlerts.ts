import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useLive } from "@/hooks/useLive";
import { getTeam } from "@/services/mockData";

/**
 * Toast notifications for goals and cards involving the user's favourite club,
 * so they stay informed while browsing any tab of the app.
 */
export function useFavoriteTeamAlerts() {
  const { profile } = useAuth();
  const { events } = useLive();
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const favorite = profile?.favoriteTeam ?? null;

  useEffect(() => {
    if (!favorite) return;
    const mine = events.filter((event) => event.teamId === favorite);

    // Don't replay history the first time the feed loads.
    if (!primed.current) {
      for (const event of mine) seen.current.add(event.id);
      primed.current = true;
      return;
    }

    const club = getTeam(favorite)?.shortName ?? "Your club";
    for (const event of [...mine].reverse()) {
      if (seen.current.has(event.id)) continue;
      seen.current.add(event.id);
      const description = `${event.minute}' · ${club} ${event.homeScore}–${event.awayScore}`;
      if (event.type === "goal") toast.success(`⚽ Goal — ${event.playerName}`, { description });
      else if (event.type === "assist") toast(`Assist — ${event.playerName}`, { description });
      else if (event.type === "yellow") toast.warning(`Yellow card — ${event.playerName}`, { description });
      else toast.error(`Red card — ${event.playerName}`, { description });
    }
  }, [events, favorite]);
}
