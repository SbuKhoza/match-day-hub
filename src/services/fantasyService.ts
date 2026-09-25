import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type {
  FantasyTeam,
  Gameweek,
  League,
  Player,
  PlayerPoints,
  PlayerPosition,
  Transfer,
} from "@/types/fantasy";
import { SQUAD_RULES, SQUAD_SIZE } from "@/types/fantasy";
import { getFantasySettings } from "./adminService";

export const COLLECTIONS = {
  fantasyTeams: "fantasyTeams",
  players: "players",
  leagues: "leagues",
  gameweeks: "gameweeks",
  transfers: "transfers",
  playerPoints: "playerPoints",
} as const;

/* ------------------------------- validation ------------------------------ */

export interface SquadValidation {
  valid: boolean;
  errors: string[];
  spent: number;
  remaining: number;
  counts: Record<PlayerPosition, number>;
}

export function validateSquad(
  squad: Player[],
  starters: string[] = [],
  budget: number = SQUAD_RULES.budget,
): SquadValidation {
  const counts: Record<PlayerPosition, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const perClub = new Map<string, number>();
  let spent = 0;

  for (const player of squad) {
    counts[player.position] += 1;
    perClub.set(player.clubId, (perClub.get(player.clubId) ?? 0) + 1);
    spent += player.price;
  }

  const errors: string[] = [];
  (Object.keys(SQUAD_RULES.positions) as PlayerPosition[]).forEach((position) => {
    const required = SQUAD_RULES.positions[position];
    if (counts[position] !== required) {
      errors.push(`Select ${required} ${position} (currently ${counts[position]}).`);
    }
  });
  for (const [clubId, count] of perClub) {
    if (count > SQUAD_RULES.maxPerClub) {
      errors.push(`Maximum ${SQUAD_RULES.maxPerClub} players from one club (${clubId}: ${count}).`);
    }
  }
  if (spent > budget) errors.push("Squad is over budget.");
  if (squad.length === SQUAD_SIZE && starters.length !== SQUAD_RULES.starters) {
    errors.push(`Pick exactly ${SQUAD_RULES.starters} starting players.`);
  }

  return { valid: errors.length === 0, errors, spent, remaining: budget - spent, counts };
}

/* ------------------------------ fantasy teams ----------------------------- */

export async function fetchFantasyTeam(db: Firestore, uid: string): Promise<FantasyTeam | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.fantasyTeams, uid));
  if (!snapshot.exists()) return null;
  return { uid, ...(snapshot.data() as Omit<FantasyTeam, "uid">) };
}

/** Saves a squad. `players` are the resolved imported players for the squad ids. */
export async function saveFantasyTeam(
  db: Firestore,
  uid: string,
  input: Pick<FantasyTeam, "name" | "squad" | "starters" | "captainId" | "viceCaptainId">,
  players: Player[],
  gameweek: number,
): Promise<void> {
  const { budget } = await getFantasySettings(db);
  const check = validateSquad(players, input.starters, budget);
  if (!check.valid) throw new Error(check.errors[0] ?? "Invalid squad");

  await setDoc(
    doc(db, COLLECTIONS.fantasyTeams, uid),
    {
      uid,
      ...input,
      budgetSpent: check.spent,
      gameweek,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/* -------------------------------- gameweeks ------------------------------- */

/** Returns the latest stored gameweek, or null when none has been set up yet. */
export async function fetchCurrentGameweek(db: Firestore): Promise<Gameweek | null> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.gameweeks), orderBy("number", "desc"), fsLimit(1)),
    );
    const first = snapshot.docs[0];
    if (first) return { id: first.id, ...(first.data() as Omit<Gameweek, "id">) };
  } catch {
    /* no gameweeks readable */
  }
  return null;
}

/* --------------------------------- leagues -------------------------------- */

function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export async function createLeague(db: Firestore, uid: string, name: string): Promise<League> {
  const code = generateInviteCode();
  const league = {
    name: name.trim(),
    code,
    ownerUid: uid,
    memberUids: [uid],
    createdAt: new Date().toISOString(),
  };
  const created = await addDoc(collection(db, COLLECTIONS.leagues), league);
  return { id: created.id, ...league };
}

export async function listLeagues(db: Firestore, uid: string): Promise<League[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.leagues), where("memberUids", "array-contains", uid)),
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<League, "id">) }));
}

export async function fetchLeague(db: Firestore, id: string): Promise<League | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.leagues, id));
  if (!snapshot.exists()) return null;
  return { id, ...(snapshot.data() as Omit<League, "id">) };
}

export async function joinLeague(db: Firestore, uid: string, code: string): Promise<League> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.leagues), where("code", "==", code.trim().toUpperCase())),
  );
  const found = snapshot.docs[0];
  if (!found) throw new Error("No league found with that invite code.");
  await updateDoc(found.ref, { memberUids: arrayUnion(uid) });
  const data = found.data() as Omit<League, "id">;
  return { id: found.id, ...data, memberUids: [...new Set([...data.memberUids, uid])] };
}

export async function leaveLeague(db: Firestore, uid: string, leagueId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.leagues, leagueId), { memberUids: arrayRemove(uid) });
}

export async function listLeagueTeams(db: Firestore, uids: string[]): Promise<FantasyTeam[]> {
  const teams = await Promise.all(uids.map((uid) => fetchFantasyTeam(db, uid).catch(() => null)));
  return teams.filter(Boolean) as FantasyTeam[];
}

/* -------------------------------- transfers ------------------------------- */

export async function recordTransfer(
  db: Firestore,
  input: Omit<Transfer, "id" | "createdAt">,
): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.transfers), {
    ...input,
    createdAt: new Date().toISOString(),
  });
}

export async function listTransfers(db: Firestore, uid: string): Promise<Transfer[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.transfers), where("uid", "==", uid)),
  );
  return snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Transfer, "id">) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------ player points ----------------------------- */

export async function listPlayerPoints(db: Firestore, gameweek?: number): Promise<PlayerPoints[]> {
  try {
    const base = collection(db, COLLECTIONS.playerPoints);
    const snapshot = await getDocs(
      typeof gameweek === "number" ? query(base, where("gameweek", "==", gameweek)) : query(base),
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlayerPoints, "id">) }));
  } catch {
    return [];
  }
}

export async function savePlayerPoints(db: Firestore, entry: PlayerPoints): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.playerPoints, entry.id), entry, { merge: true });
}
