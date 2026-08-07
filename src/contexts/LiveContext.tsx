import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { buildSeason, buildTable, type SeasonMatch, type TableRow } from "@/services/leagueData";
import { derivePoints, playersByClub } from "@/services/liveScoring";
import {
  claimWriterLock,
  publishLiveState,
  releaseWriterLock,
  subscribeLiveState,
  type LiveEvent,
} from "@/services/liveSyncService";
import { useAuth } from "@/hooks/useAuth";
import type { PlayerPoints } from "@/types/fantasy";

export type { LiveEvent, LiveEventType } from "@/services/liveSyncService";

interface LiveContextValue {
  matches: SeasonMatch[];
  events: LiveEvent[];
  table: TableRow[];
  /** Fantasy points for the current gameweek, derived from live match events. */
  livePoints: PlayerPoints[];
  lastUpdated: number;
  /** True while this tab owns the simulation and writes to Firestore. */
  isWriter: boolean;
  /** Hold back live re-renders (used while building a squad) and release them later. */
  pauseUpdates: () => void;
  resumeUpdates: () => void;
}

export const LiveContext = createContext<LiveContextValue | null>(null);

const TICK_MS = 4000;
const GOAL_CHANCE = 0.16;
const CARD_CHANCE = 0.08;

function pickScorer(clubId: string) {
  const squad = playersByClub.get(clubId) ?? [];
  const attackers = squad.filter((p) => p.position === "FWD" || p.position === "MID");
  const pool = attackers.length > 0 ? attackers : squad;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickOutfield(clubId: string) {
  const squad = (playersByClub.get(clubId) ?? []).filter((p) => p.position !== "GK");
  return squad[Math.floor(Math.random() * squad.length)];
}

interface LiveSnapshot {
  matches: SeasonMatch[];
  events: LiveEvent[];
}

/** Advances every in-progress match by a minute and returns the events it generated. */
function simulate(snapshot: LiveSnapshot, seq: { value: number }): LiveSnapshot | null {
  const newEvents: LiveEvent[] = [];
  let changed = false;

  const matches = snapshot.matches.map((match) => {
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
        if (scoringHome) homeScore += 1;
        else awayScore += 1;
        seq.value += 1;
        newEvents.push({
          id: `${match.id}-${seq.value}`,
          matchId: match.id,
          teamId,
          playerId: scorer.id,
          playerName: scorer.name,
          type: "goal",
          minute,
          homeScore,
          awayScore,
        });
        const assister = pickOutfield(teamId);
        if (assister && assister.id !== scorer.id && Math.random() < 0.7) {
          seq.value += 1;
          newEvents.push({
            id: `${match.id}-${seq.value}`,
            matchId: match.id,
            teamId,
            playerId: assister.id,
            playerName: assister.name,
            type: "assist",
            minute,
            homeScore,
            awayScore,
          });
        }
      }
    }

    if (Math.random() < CARD_CHANCE) {
      const teamId = Math.random() < 0.5 ? match.home.id : match.away.id;
      const booked = pickOutfield(teamId);
      if (booked) {
        seq.value += 1;
        newEvents.push({
          id: `${match.id}-${seq.value}`,
          matchId: match.id,
          teamId,
          playerId: booked.id,
          playerName: booked.name,
          type: "yellow",
          minute,
          homeScore,
          awayScore,
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

  if (!changed) return null;
  return { matches, events: [...newEvents, ...snapshot.events].slice(0, 200) };
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const { services } = useAuth();
  const db = services?.db ?? null;

  const stateRef = useRef<LiveSnapshot>({ matches: buildSeason(), events: [] });
  const seq = useRef({ value: 0 });
  const writerId = useRef<string>(Math.random().toString(36).slice(2));
  const pauseCount = useRef(0);
  const pending = useRef(false);

  const [snapshot, setSnapshot] = useState<LiveSnapshot>(stateRef.current);
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());
  const [isWriter, setIsWriter] = useState(false);

  /** Publishes ref state to React state unless the user asked for a quiet period. */
  const flush = useCallback(() => {
    if (pauseCount.current > 0) {
      pending.current = true;
      return;
    }
    pending.current = false;
    setSnapshot(stateRef.current);
    setLastUpdated(Date.now());
  }, []);

  const pauseUpdates = useCallback(() => {
    pauseCount.current += 1;
  }, []);

  const resumeUpdates = useCallback(() => {
    pauseCount.current = Math.max(0, pauseCount.current - 1);
    if (pauseCount.current === 0 && pending.current) flush();
  }, [flush]);

  // Listen to the shared Firestore live state so every tab and device agrees.
  useEffect(() => {
    if (!db) return;
    const unsubscribe = subscribeLiveState(db, (payload) => {
      if (payload.writerId === writerId.current) return;
      stateRef.current = { matches: payload.matches, events: payload.events };
      flush();
    });
    return unsubscribe;
  }, [db, flush]);

  // Simulation ticker — only the writer tab advances matches and publishes them.
  useEffect(() => {
    const id = window.setInterval(() => {
      const writing = claimWriterLock(writerId.current);
      setIsWriter(writing);
      if (!writing && db) return; // a sibling tab drives the feed via Firestore

      const next = simulate(stateRef.current, seq.current);
      if (!next) return;
      stateRef.current = next;
      flush();

      if (db) {
        void publishLiveState(db, {
          matches: next.matches,
          events: next.events,
          points: derivePoints(next.matches, next.events),
          updatedAt: Date.now(),
          writerId: writerId.current,
        });
      }
    }, TICK_MS);

    const id2 = writerId.current;
    return () => {
      window.clearInterval(id);
      releaseWriterLock(id2);
    };
  }, [db, flush]);

  const table = useMemo(() => buildTable(snapshot.matches), [snapshot.matches]);
  const livePoints = useMemo(
    () => derivePoints(snapshot.matches, snapshot.events),
    [snapshot.matches, snapshot.events],
  );

  const value = useMemo<LiveContextValue>(
    () => ({
      matches: snapshot.matches,
      events: snapshot.events,
      table,
      livePoints,
      lastUpdated,
      isWriter,
      pauseUpdates,
      resumeUpdates,
    }),
    [snapshot, table, livePoints, lastUpdated, isWriter, pauseUpdates, resumeUpdates],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
