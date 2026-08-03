import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { initFirebase, type FirebaseServices } from "@/firebase";
import { createUserProfile, fetchUserProfile, updateUserProfile } from "@/services/userService";
import type { ThemeMode, UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  services: FirebaseServices | null;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  saveFavoriteTeam: (teamId: string) => Promise<void>;
  savePreferredTheme: (theme: ThemeMode) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;

    initFirebase()
      .then((fb) => {
        if (!active) return;
        setServices(fb);
        unsubscribe = onAuthStateChanged(fb.auth, async (nextUser) => {
          setUser(nextUser);
          setProfile(nextUser ? await fetchUserProfile(fb.db, nextUser.uid).catch(() => null) : null);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const requireServices = useCallback(async () => services ?? (await initFirebase()), [services]);

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ name, email, password }) => {
      const fb = await requireServices();
      const credential = await createUserWithEmailAndPassword(fb.auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      const created = await createUserProfile(fb.db, {
        uid: credential.user.uid,
        name,
        email,
        theme: (document.documentElement.classList.contains("dark") ? "dark" : "light") as ThemeMode,
      });
      setProfile(created);
    },
    [requireServices],
  );

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async ({ email, password }) => {
      const fb = await requireServices();
      await signInWithEmailAndPassword(fb.auth, email, password);
    },
    [requireServices],
  );

  const resetPassword = useCallback(
    async (email: string) => {
      const fb = await requireServices();
      await sendPasswordResetEmail(fb.auth, email, { url: window.location.origin + "/auth" });
    },
    [requireServices],
  );

  const logout = useCallback(async () => {
    const fb = await requireServices();
    await signOut(fb.auth);
    setProfile(null);
  }, [requireServices]);

  const saveFavoriteTeam = useCallback(
    async (teamId: string) => {
      const fb = await requireServices();
      if (!fb.auth.currentUser) return;
      await updateUserProfile(fb.db, fb.auth.currentUser.uid, { favoriteTeam: teamId });
      setProfile((prev) => (prev ? { ...prev, favoriteTeam: teamId } : prev));
    },
    [requireServices],
  );

  const savePreferredTheme = useCallback(
    async (theme: ThemeMode) => {
      const fb = await requireServices();
      if (!fb.auth.currentUser) return;
      await updateUserProfile(fb.db, fb.auth.currentUser.uid, { theme }).catch(() => undefined);
      setProfile((prev) => (prev ? { ...prev, theme } : prev));
    },
    [requireServices],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      services,
      signUp,
      signIn,
      resetPassword,
      logout,
      saveFavoriteTeam,
      savePreferredTheme,
    }),
    [
      user,
      profile,
      loading,
      services,
      signUp,
      signIn,
      resetPassword,
      logout,
      saveFavoriteTeam,
      savePreferredTheme,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}