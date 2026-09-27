/**
 * Firebase master data access: clubs and players imported from the
 * WorldFootball export, plus the import audit trail.
 *
 * Master data changes only when an administrator imports a file, so it is read
 * with one-off queries and cached by the query layer — never with live listeners.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import type {
  DataImportRecord,
  MasterPlayer,
  MasterStaff,
  MasterTeam,
  PlayerTransferRecord,
} from "@/types/master";

export const COLLECTIONS = {
  teams: "teams",
  players: "players",
  staff: "staff",
  playerTransfers: "playerTransfers",
  matches: "matches",
  matchEvents: "matchEvents",
  playerMatchStats: "playerMatchStats",
  dataImports: "dataImports",
  admins: "admins",
} as const;

const BATCH_LIMIT = 400;

/* ---------------------------------- reads --------------------------------- */

export async function listTeams(db: Firestore): Promise<MasterTeam[]> {
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.teams), orderBy("teamName")));
  return snapshot.docs.map((entry) => entry.data() as MasterTeam);
}

export async function getTeamById(db: Firestore, teamId: string): Promise<MasterTeam | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.teams, teamId));
  return snapshot.exists() ? (snapshot.data() as MasterTeam) : null;
}

export async function listPlayers(
  db: Firestore,
  options: { teamId?: string; max?: number } = {},
): Promise<MasterPlayer[]> {
  // A `where("teamId", ...)` filter combined with `orderBy("playerName")` in the
  // same query needs a Firestore composite index. That index was never deployed,
  // so any team-filtered fetch silently failed and every "Squad" section on a
  // club page rendered as empty, even though the players existed. Sorting on
  // the client instead of in the query sidesteps the missing-index requirement
  // entirely (it only needs Firestore's automatic single-field index on teamId).
  const constraints = options.teamId
    ? [where("teamId", "==", options.teamId)]
    : [orderBy("playerName"), ...(options.max ? [fsLimit(options.max)] : [])];
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.players), ...constraints));
  const players = snapshot.docs.map((entry) => entry.data() as MasterPlayer);
  if (!options.teamId) return players;
  players.sort((a, b) => a.playerName.localeCompare(b.playerName));
  return options.max ? players.slice(0, options.max) : players;
}

export async function getPlayerById(db: Firestore, playerId: string): Promise<MasterPlayer | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.players, playerId));
  return snapshot.exists() ? (snapshot.data() as MasterPlayer) : null;
}

/** Same composite-index pitfall as `listPlayers` — see the comment there. */
export async function listStaff(
  db: Firestore,
  options: { teamId?: string } = {},
): Promise<MasterStaff[]> {
  const constraints = options.teamId
    ? [where("teamId", "==", options.teamId)]
    : [orderBy("fullName")];
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.staff), ...constraints));
  const staff = snapshot.docs.map((entry) => entry.data() as MasterStaff);
  if (options.teamId) staff.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return staff;
}

export async function getStaffById(db: Firestore, staffId: string): Promise<MasterStaff | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.staff, staffId));
  return snapshot.exists() ? (snapshot.data() as MasterStaff) : null;
}

export async function listImports(db: Firestore, max = 20): Promise<DataImportRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.dataImports), orderBy("importedAt", "desc"), fsLimit(max)),
  );
  return snapshot.docs.map((entry) => entry.data() as DataImportRecord);
}

export async function isAdmin(db: Firestore, uid: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.admins, uid));
  return snapshot.exists();
}

/* --------------------------------- writes --------------------------------- */

async function commitInChunks<T>(
  db: Firestore,
  items: T[],
  write: (batch: ReturnType<typeof writeBatch>, item: T) => void,
): Promise<void> {
  for (let index = 0; index < items.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const item of items.slice(index, index + BATCH_LIMIT)) write(batch, item);
    await batch.commit();
  }
}

/** Creates or updates clubs by stable teamId — never duplicates on re-import. */
export async function upsertTeams(db: Firestore, teams: MasterTeam[]): Promise<void> {
  await commitInChunks(db, teams, (batch, team) => {
    batch.set(doc(db, COLLECTIONS.teams, team.teamId), team, { merge: true });
  });
}

/** Creates or updates players by stable playerId — a transfer updates, never replaces. */
export async function upsertPlayers(db: Firestore, players: MasterPlayer[]): Promise<void> {
  await commitInChunks(db, players, (batch, player) => {
    batch.set(doc(db, COLLECTIONS.players, player.playerId), player, { merge: true });
  });
}

/** Creates or updates staff by stable staffId. */
export async function upsertStaff(db: Firestore, staff: MasterStaff[]): Promise<void> {
  await commitInChunks(db, staff, (batch, member) => {
    batch.set(doc(db, COLLECTIONS.staff, member.staffId), member, { merge: true });
  });
}

export async function recordTransfers(
  db: Firestore,
  transfers: PlayerTransferRecord[],
): Promise<void> {
  await commitInChunks(db, transfers, (batch, transfer) => {
    batch.set(doc(db, COLLECTIONS.playerTransfers, transfer.transferId), transfer);
  });
}

export async function recordImport(db: Firestore, entry: DataImportRecord): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.dataImports, entry.importId), entry);
}