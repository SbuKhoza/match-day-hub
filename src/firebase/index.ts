import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

import { getFirebaseConfig } from "./config.functions";

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let pending: Promise<FirebaseServices> | null = null;

/** Lazily initializes Firebase in the browser (single instance). */
export function initFirebase(): Promise<FirebaseServices> {
  if (!pending) {
    pending = (async () => {
      const config = await getFirebaseConfig();
      const app = getApps()[0] ?? initializeApp(config);
      const auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence).catch(() => undefined);
      return { app, auth, db: getFirestore(app), storage: getStorage(app) };
    })();
  }
  return pending;
}