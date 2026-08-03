const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-password": "Please enter your password.",
  "auth/weak-password": "Passwords need at least 6 characters.",
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "We couldn't find an account with that email.",
  "auth/too-many-requests": "Too many attempts. Try again in a moment.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/configuration-not-found":
    "Email/password sign-in isn't enabled yet in the Firebase console (Authentication → Sign-in method).",
  "auth/operation-not-allowed":
    "Email/password sign-in isn't enabled yet in the Firebase console (Authentication → Sign-in method).",
};

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const mapped = code ? MESSAGES[code] : undefined;
  if (mapped) return mapped;
  return (error as Error)?.message ?? "Something went wrong. Please try again.";
}