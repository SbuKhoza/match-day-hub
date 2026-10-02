/**
 * Administrator-only writes: manual club/player edits, fantasy settings,
 * editorial content (news, videos) and user management.
 * Firestore rules enforce that only accounts listed in `admins` can write.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  type Firestore,
} from "firebase/firestore";

import type { Article, Video } from "@/types";
import { SQUAD_RULES } from "@/types/fantasy";
import type { MasterPlayer, MasterStaff, MasterTeam } from "@/types/master";
import { COLLECTIONS } from "./masterDataService";

/* ------------------------------ fantasy settings ----------------------------- */

export interface FantasySettings {
  budget: number;
  /** First day of the season, "YYYY-MM-DD". */
  seasonStart: string | null;
  /** Last day of the season, "YYYY-MM-DD". */
  seasonEnd: string | null;
  /** First day of the second half of the season, "YYYY-MM-DD". */
  secondHalfStart: string | null;
  updatedAt: string | null;
}

export const DEFAULT_SETTINGS: FantasySettings = {
  budget: SQUAD_RULES.budget,
  seasonStart: null,
  seasonEnd: null,
  secondHalfStart: null,
  updatedAt: null,
};

function asDateString(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function getFantasySettings(db: Firestore): Promise<FantasySettings> {
  const snapshot = await getDoc(doc(db, "settings", "fantasy"));
  if (!snapshot.exists()) return DEFAULT_SETTINGS;
  const data = snapshot.data();
  const budget = Number(data["budget"]);
  return {
    budget: Number.isFinite(budget) && budget > 0 ? budget : SQUAD_RULES.budget,
    seasonStart: asDateString(data["seasonStart"]),
    seasonEnd: asDateString(data["seasonEnd"]),
    secondHalfStart: asDateString(data["secondHalfStart"]),
    updatedAt: (data["updatedAt"] as string) ?? null,
  };
}

export async function saveFantasySettings(db: Firestore, budget: number): Promise<void> {
  await setDoc(
    doc(db, "settings", "fantasy"),
    { budget, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

export interface SeasonDates {
  seasonStart: string;
  seasonEnd: string;
  secondHalfStart: string;
}

/** Returns an error message when the dates are not a valid season, otherwise null. */
export function validateSeasonDates(dates: SeasonDates): string | null {
  const { seasonStart, seasonEnd, secondHalfStart } = dates;
  if (!seasonStart || !seasonEnd || !secondHalfStart) return "Fill in all three dates.";
  if (seasonEnd <= seasonStart) return "The season must end after it starts.";
  if (secondHalfStart <= seasonStart || secondHalfStart > seasonEnd) {
    return "The second half must start after the season starts and on or before it ends.";
  }
  return null;
}

export async function saveSeasonDates(db: Firestore, dates: SeasonDates): Promise<void> {
  const error = validateSeasonDates(dates);
  if (error) throw new Error(error);
  await setDoc(
    doc(db, "settings", "fantasy"),
    { ...dates, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

/* ------------------------------- teams / players ----------------------------- */

export async function saveTeam(db: Firestore, team: MasterTeam): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.teams, team.teamId), team, { merge: true });
}

export async function deleteTeam(db: Firestore, teamId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.teams, teamId));
}

export async function savePlayer(db: Firestore, player: MasterPlayer): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.players, player.playerId), player, { merge: true });
}

export async function deletePlayer(db: Firestore, playerId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.players, playerId));
}

/* --------------------------------- staff -------------------------------- */

export async function saveStaff(db: Firestore, staff: MasterStaff): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.staff, staff.staffId), staff, { merge: true });
}

export async function deleteStaff(db: Firestore, staffId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.staff, staffId));
}

/* ---------------------------------- content ---------------------------------- */

export async function listNews(db: Firestore): Promise<Article[]> {
  const snapshot = await getDocs(query(collection(db, "news"), orderBy("publishedAt", "desc")));
  return snapshot.docs.map((entry) => ({ ...(entry.data() as Article), id: entry.id }));
}

export async function saveNews(db: Firestore, article: Article): Promise<void> {
  await setDoc(doc(db, "news", article.id), article);
}

export async function deleteNews(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, "news", id));
}

export async function listVideos(db: Firestore): Promise<Video[]> {
  const snapshot = await getDocs(query(collection(db, "videos"), orderBy("publishedAt", "desc")));
  return snapshot.docs.map((entry) => ({ ...(entry.data() as Video), id: entry.id }));
}

export async function saveVideo(db: Firestore, video: Video): Promise<void> {
  await setDoc(doc(db, "videos", video.id), video);
}

export async function deleteVideo(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, "videos", id));
}

/* ----------------------------------- users ----------------------------------- */

export interface ManagedUser {
  uid: string;
  name: string;
  email: string;
  favoriteTeam: string | null;
  disabled: boolean;
  createdAt: string | null;
}

export async function listUsers(db: Firestore): Promise<ManagedUser[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    const created = data["createdAt"];
    return {
      uid: entry.id,
      name: (data["name"] as string) ?? "",
      email: (data["email"] as string) ?? "",
      favoriteTeam: (data["favoriteTeam"] as string | null) ?? null,
      disabled: data["disabled"] === true,
      createdAt:
        typeof created?.toDate === "function"
          ? created.toDate().toISOString()
          : ((created as string) ?? null),
    };
  });
}

export async function updateUser(
  db: Firestore,
  uid: string,
  patch: Partial<Pick<ManagedUser, "name" | "favoriteTeam" | "disabled">>,
): Promise<void> {
  await setDoc(doc(db, "users", uid), patch, { merge: true });
}

export async function deleteUserData(db: Firestore, uid: string): Promise<void> {
  await deleteDoc(doc(db, "fantasyTeams", uid)).catch(() => undefined);
  await deleteDoc(doc(db, "users", uid));
}