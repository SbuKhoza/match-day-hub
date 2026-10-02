/**
 * Game week schedule and deadlines.
 *
 * A game week's deadline is one hour before its first match kicks off. Admins record the first
 * kick-off; everything else (lock state, which game week a change applies to, season half) is
 * derived here so every screen and the save path agree.
 */
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  type Firestore,
} from "firebase/firestore";

import type { Gameweek, SeasonHalf } from "@/types/fantasy";

const GAMEWEEKS = "gameweeks";

/** Deadline sits this long before the first kick-off. */
export const DEADLINE_LEAD_MS = 60 * 60 * 1000;

export function deadlineFromKickoff(firstKickoff: string): string {
  return new Date(Date.parse(firstKickoff) - DEADLINE_LEAD_MS).toISOString();
}

/** Deadline as epoch ms, or null when the game week has no usable date. */
export function gameweekDeadline(gameweek: Gameweek): number | null {
  const source = gameweek.firstKickoff
    ? Date.parse(gameweek.firstKickoff) - DEADLINE_LEAD_MS
    : Date.parse(gameweek.deadline);
  return Number.isFinite(source) ? source : null;
}

export function isGameweekLocked(gameweek: Gameweek | null | undefined, now = Date.now()): boolean {
  if (!gameweek) return false;
  const deadline = gameweekDeadline(gameweek);
  return deadline !== null && now >= deadline;
}

export interface EditTarget {
  /** The game week any change made right now applies to. */
  number: number;
  /** Its stored record, or null when the admin has not scheduled it yet. */
  gameweek: Gameweek | null;
  /** True when the previous game week's deadline has passed, so changes roll over to `number`. */
  rolledOver: boolean;
  /** The game week whose deadline has already passed (the one now in play), if any. */
  lockedGameweek: Gameweek | null;
  deadline: number | null;
}

/**
 * Picks the game week a manager can still change: the first one whose deadline has not passed.
 * When every scheduled game week is locked, changes apply to the one after the last.
 * Returns null when no game weeks exist (nothing to enforce).
 */
export function resolveEditTarget(gameweeks: Gameweek[], now = Date.now()): EditTarget | null {
  if (gameweeks.length === 0) return null;
  const sorted = [...gameweeks].sort((a, b) => a.number - b.number);
  const open = sorted.find((gw) => !isGameweekLocked(gw, now));
  const locked = sorted.filter((gw) => isGameweekLocked(gw, now));
  const lockedGameweek = locked[locked.length - 1] ?? null;

  if (open) {
    return {
      number: open.number,
      gameweek: open,
      rolledOver: Boolean(lockedGameweek && lockedGameweek.number < open.number),
      lockedGameweek,
      deadline: gameweekDeadline(open),
    };
  }
  const last = sorted[sorted.length - 1]!;
  return { number: last.number + 1, gameweek: null, rolledOver: true, lockedGameweek: last, deadline: null };
}

/**
 * Season half for a game week, from the admin's second-half start date ("YYYY-MM-DD").
 * Before the date is set everything counts as the first half.
 */
export function seasonHalfFor(
  gameweek: Gameweek | null | undefined,
  secondHalfStart: string | null,
  now = Date.now(),
): SeasonHalf {
  if (!secondHalfStart) return 1;
  const boundary = Date.parse(`${secondHalfStart}T00:00:00`);
  if (!Number.isFinite(boundary)) return 1;
  const kickoff = gameweek?.firstKickoff ? Date.parse(gameweek.firstKickoff) : NaN;
  const reference = Number.isFinite(kickoff) ? kickoff : (gameweek ? gameweekDeadline(gameweek) : null) ?? now;
  return reference >= boundary ? 2 : 1;
}

/* -------------------------------- persistence -------------------------------- */

export async function listGameweeks(db: Firestore): Promise<Gameweek[]> {
  try {
    const snapshot = await getDocs(query(collection(db, GAMEWEEKS), orderBy("number", "asc")));
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Gameweek, "id">) }));
  } catch {
    return [];
  }
}

export interface GameweekInput {
  number: number;
  firstKickoff: string;
  status: Gameweek["status"];
}

export async function saveGameweek(db: Firestore, input: GameweekInput): Promise<void> {
  if (!Number.isInteger(input.number) || input.number < 1) throw new Error("Game week must be 1 or higher.");
  if (!Number.isFinite(Date.parse(input.firstKickoff))) throw new Error("Enter the first kick-off date and time.");
  await setDoc(
    doc(db, GAMEWEEKS, `gw-${input.number}`),
    {
      number: input.number,
      status: input.status,
      firstKickoff: input.firstKickoff,
      // Kept in sync so older screens that read `deadline` stay correct.
      deadline: deadlineFromKickoff(input.firstKickoff),
    },
    { merge: true },
  );
}