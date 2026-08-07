import { doc, onSnapshot, setDoc, type Firestore, type Unsubscribe } from "firebase/firestore";

import type { SeasonMatch } from "./leagueData";
import type { PlayerPoints } from "@/types/fantasy";

export type LiveEventType = "goal" | "assist" | "yellow" | "red";

export interface LiveEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  playerName: string;
  type: LiveEventType;
  minute: number;
  /** Score right after this event, so the timeline can show score changes. */
  homeScore: number;
  awayScore: number;
}

export interface LiveStatePayload {
  matches: SeasonMatch[];
  events: LiveEvent[];
  points: PlayerPoints[];
  updatedAt: number;
  writerId: string;
}

const LIVE_COLLECTION = "live";
const LIVE_DOC_ID = "state";

/** Firestore rejects `undefined`; strip it before writing. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function subscribeLiveState(
  db: Firestore,
  onData: (payload: LiveStatePayload) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, LIVE_COLLECTION, LIVE_DOC_ID),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Partial<LiveStatePayload>;
      if (!Array.isArray(data.matches) || !Array.isArray(data.events)) return;
      onData({
        matches: data.matches,
        events: data.events,
        points: Array.isArray(data.points) ? data.points : [],
        updatedAt: data.updatedAt ?? Date.now(),
        writerId: data.writerId ?? "",
      });
    },
    () => {
      /* offline or rules — the local simulation keeps the UI alive */
    },
  );
}

export async function publishLiveState(db: Firestore, payload: LiveStatePayload): Promise<void> {
  await setDoc(doc(db, LIVE_COLLECTION, LIVE_DOC_ID), clean(payload)).catch(() => undefined);
}

/* ------------------------------- leadership ------------------------------- */

const LOCK_KEY = "kickoff:live-writer";
const LOCK_TTL = 12_000;

/**
 * Exactly one tab per browser simulates and writes the live state; every other
 * tab (and device) just listens, so the feed stays consistent everywhere.
 */
export function claimWriterLock(writerId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(LOCK_KEY);
    const now = Date.now();
    if (raw) {
      const lock = JSON.parse(raw) as { id: string; ts: number };
      if (lock.id !== writerId && now - lock.ts < LOCK_TTL) return false;
    }
    window.localStorage.setItem(LOCK_KEY, JSON.stringify({ id: writerId, ts: now }));
    return true;
  } catch {
    return true;
  }
}

export function releaseWriterLock(writerId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCK_KEY);
    if (!raw) return;
    const lock = JSON.parse(raw) as { id: string };
    if (lock.id === writerId) window.localStorage.removeItem(LOCK_KEY);
  } catch {
    /* ignore */
  }
}
