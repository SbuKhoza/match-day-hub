import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import type { ThemeMode, UserProfile } from "@/types";

const COLLECTION = "users";

export async function createUserProfile(
  db: Firestore,
  input: { uid: string; name: string; email: string; theme: ThemeMode },
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: input.uid,
    name: input.name,
    email: input.email,
    favoriteTeam: null,
    createdAt: new Date().toISOString(),
    theme: input.theme,
  };
  await setDoc(doc(db, COLLECTION, input.uid), { ...profile, createdAt: serverTimestamp() });
  return profile;
}

export async function fetchUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const createdAt = data["createdAt"];
  return {
    uid,
    name: (data["name"] as string) ?? "",
    email: (data["email"] as string) ?? "",
    favoriteTeam: (data["favoriteTeam"] as string | null) ?? null,
    createdAt:
      typeof createdAt?.toDate === "function"
        ? createdAt.toDate().toISOString()
        : ((createdAt as string) ?? new Date().toISOString()),
    theme: (data["theme"] as ThemeMode) ?? "light",
  };
}

export async function updateUserProfile(
  db: Firestore,
  uid: string,
  patch: Partial<Pick<UserProfile, "name" | "favoriteTeam" | "theme">>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), patch);
}