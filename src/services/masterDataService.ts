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
  MasterTeam,
  PlayerTransferRecord,
} from "@/types/master";

export const COLLECTIONS = {
  teams: "teams",
  players: "players",
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
  const constraints = [
    ...(options.teamId ? [where("teamId", "==", options.teamId)] : []),
    orderBy("playerName"),
    ...(options.max ? [fsLimit(options.max)] : []),
  ];
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.players), ...constraints));
  return snapshot.docs.map((entry) => entry.data() as MasterPlayer);
}

export async function getPlayerById(db: Firestore, playerId: string): Promise<MasterPlayer | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.players, playerId));
  return snapshot.exists() ? (snapshot.data() as MasterPlayer) : null;
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
