import { createServerFn } from "@tanstack/react-start";

/**
 * Firebase web config. The apiKey is a publishable browser key, but it is kept
 * in project secrets, so it is delivered to the client through this function.
 */
export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(async () => ({
  apiKey: (process.env["GOOGLE_API_KEY"] ?? "").trim(),
  authDomain: "boltapp-b2dda.firebaseapp.com",
  projectId: "boltapp-b2dda",
  storageBucket: "boltapp-b2dda.firebasestorage.app",
  messagingSenderId: "176903704546",
  appId: "1:176903704546:web:aea9172d360795d69833bb",
}));