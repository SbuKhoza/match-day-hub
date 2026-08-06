import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CURRENT_ROUND, buildSeason, buildTable, type SeasonMatch, type TableRow } from "@/services/leagueData";
import { PLAYERS } from "@/services/playerPool";
import { emptyStatLine, scoreStatLine } from "@/services/scoringService";
import { CURRENT_GAMEWEEK } from "@/services/fantasyService";
import type { PlayerPoints, PlayerStatLine } from "@/types/fantasy";

export type LiveEventType = "goal" | "assist" | "yellow" | "red";

export interface LiveEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  playerName: string;
  type: LiveEventType;
  minute: number;
}

interface LiveContextValue {
  matches: SeasonMatch[];
  events: LiveEvent[];
  table: TableRow[];
  /** Fantasy points for the current gameweek, derived from live match events. */
  livePoints: PlayerPoints[];
  lastUpdated: number;
}

export const LiveContext = createContext<LiveContextValue | null>(null);

const TICK_MS = 4000;
const GOAL_CHANCE = 0.16;
const CARD_CHANCE = 0.08;

const byClub = new Map<string, typeof PLAYERS>();
for (const player of PLAYERS) {
  const list = byClub.get(player.clubId) ?? [];
  list.push(player);
  byClub.set(player.clubId, list);
}

function pickScorer(clubId: string) {
  const squad = byClub.get(clubId) ?? [];
  const attackers = squad.filter((p) => p.position === "FWD" || p.position === "MID");
  const pool = attackers.length > 0 ? attackers : squad;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickOutfield(clubId: string) {
  const squad = (byClub.get(clubId) ?? []).filter((p) => p.position !== "GK");
  return squad[Math.floor(Math.random() * squad.length)];
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<SeasonMatch[]>(() => buildSeason());
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());
  const counter = useRef(0);

  const tick = useCallback(() => {
    const newEvents: LiveEvent[] = [];

    setMatches((current) => {
      let changed = false;
      const next = current.map((match) => {
        if (match.status !== "live") return match;
        changed = true;
        const minute = Math.min(90, (match.minute ?? 0) + 1);
        let homeScore = match.homeScore ?? 0;
        let awayScore = match.awayScore ?? 0;

        if (Math.random() < GOAL_CHANCE) {
          const scoringHome = Math.random() < 0.55;
          const teamId = scoringHome ? match.home.id : match.away.id;
          const scorer = pickScorer(teamId);
          if (scorer) {
            counter.current += 1;
            newEvents.push({
              id: `${match.id}-${counter.current}`,
              matchId: match.id,
              teamId,
              playerId: scorer.id,
              playerName: scorer.name,
              type: "goal",
              minute,
            });
            const assister = pickOutfield(teamId);
            if (assister && assister.id !== scorer.id && Math.random() < 0.7) {
              counter.current += 1;
              newEvents.push({
                id: `${match.id}-${counter.current}`,
                matchId: match.id,
                teamId,
                playerId: assister.id,
                playerName: assister.name,
                type: "assist",
                minute,
              });
            }
            if (scoringHome) homeScore += 1;
            else awayScore += 1;
          }
        }

        if (Math.random() < CARD_CHANCE) {
          const teamId = Math.random() < 0.5 ? match.home.id : match.away.id;
          const booked = pickOutfield(teamId);
          if (booked) {
            counter.current += 1;
            newEvents.push({
              id: `${match.id}-${counter.current}`,
              matchId: match.id,
              teamId,
              playerId: booked.id,
              playerName: booked.name,
              type: "yellow",
              minute,
            });
          }
        }

        return {
          ...match,
          minute,
          homeScore,
          awayScore,
          status: minute >= 90 ? ("finished" as const) : match.status,
        };
      });
      return changed ? next : current;
    });

    if (newEvents.length > 0) setEvents((prev) => [...newEvents, ...prev].slice(0, 200));
    setLastUpdated(Date.now());
  }, []);

  useEffect(() => {
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [tick]);

  const table = useMemo(() => buildTable(matches), [matches]);

  const livePoints = useMemo<PlayerPoints[]>(() => {
    const stats = new Map<string, PlayerStatLine>();
    const ensure = (playerId: string) => {
      const existing = stats.get(playerId);
      if (existing) return existing;
      const created = { ...emptyStatLine(), appeared: true };
      stats.set(playerId, created);
      return created;
    };

    // Everyone involved in a current-round match that has kicked off gets an appearance.
    for (const match of matches) {
      if (match.round !== CURRENT_ROUND || match.status === "upcoming") continue;
      for (const clubId of [match.home.id, match.away.id]) {
        for (const player of byClub.get(clubId) ?? []) ensure(player.id);
      }
      if (match.status === "finished") {
        if ((match.awayScore ?? 0) === 0) {
          for (const p of byClub.get(match.home.id) ?? []) {
            if (p.position === "GK" || p.position === "DEF") ensure(p.id).cleanSheet = true;
          }
        }
        if ((match.homeScore ?? 0) === 0) {
          for (const p of byClub.get(match.away.id) ?? []) {
            if (p.position === "GK" || p.position === "DEF") ensure(p.id).cleanSheet = true;
          }
        }
      }
    }

    for (const event of events) {
      const line = ensure(event.playerId);
      if (event.type === "goal") line.goals += 1;
      if (event.type === "assist") line.assists += 1;
      if (event.type === "yellow") line.yellowCards += 1;
      if (event.type === "red") line.redCards += 1;
    }

    return [...stats.entries()].map(([playerId, line]) => ({
      id: `live-${CURRENT_GAMEWEEK.number}-${playerId}`,
      playerId,
      gameweek: CURRENT_GAMEWEEK.number,
      stats: line,
      points: scoreStatLine(line),
    }));
  }, [matches, events]);

  const value = useMemo<LiveContextValue>(
    () => ({ matches, events, table, livePoints, lastUpdated }),
    [matches, events, table, livePoints, lastUpdated],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
