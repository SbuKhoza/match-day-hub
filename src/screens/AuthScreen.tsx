import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { AuthCard, AuthError, AuthNotice } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { authErrorMessage } from "@/components/auth/authErrors";
import { Button } from "@/components/common/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  login: { title: "Welcome back", subtitle: "Sign in to your Kickoff account.", cta: "Sign in" },
  signup: {
    title: "Create your account",
    subtitle: "Follow your club, play fantasy, never miss a goal.",
    cta: "Create account",
  },
  forgot: {
    title: "Reset password",
    subtitle: "We'll email you a link to set a new password.",
    cta: "Send reset link",
  },
};

export function AuthScreen() {
  const { user, profile, loading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    navigate({ to: profile && !profile.favoriteTeam ? "/onboarding" : "/", replace: true });
  }, [loading, user, profile, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp({ name, email, password });
        navigate({ to: "/onboarding", replace: true });
      } else if (mode === "login") {
        await signIn({ email, password });
      } else {
        await resetPassword(email);
        setNotice("Check your inbox for the reset link.");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const copy = COPY[mode];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
            KO
          </span>
          <span className="text-lg font-semibold tracking-tight">Kickoff</span>
        </span>
        <ThemeToggle />
      </div>

      <AuthCard
        title={copy.title}
        subtitle={copy.subtitle}
        footer={
          mode === "login" ? (
            <span>
              New here?{" "}
              <button className="font-medium text-foreground underline" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button className="font-medium text-foreground underline" onClick={() => setMode("login")}>
                Sign in
              </button>
            </span>
          )
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <AuthField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              autoComplete="name"
              required
            />
          ) : null}

          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />

          {mode !== "forgot" ? (
            <AuthField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
            />
          ) : null}

          <AuthError message={error} />
          <AuthNotice message={notice} />

          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? "Please wait…" : copy.cta}
          </Button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}
            >
              {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
            </button>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}