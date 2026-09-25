import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { AuthCard, AuthError } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { authErrorMessage } from "@/components/auth/authErrors";
import { Button } from "@/components/common/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useMasterData";

export function AdminLoginScreen() {
  const { user, loading, signIn, logout } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || adminLoading || !user) return;
    if (isAdmin) {
      navigate({ to: "/admin", replace: true });
    } else {
      setError("This account doesn't have admin access.");
      logout();
    }
  }, [loading, adminLoading, user, isAdmin, navigate, logout]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn({ email, password });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
            KO
          </span>
          <span className="text-lg font-semibold tracking-tight">Kickoff Admin</span>
        </span>
        <ThemeToggle />
      </div>

      <AuthCard title="Admin sign in" subtitle="Restricted to Kickoff administrators.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@kickoff.com"
            autoComplete="email"
            required
          />
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <AuthError message={error} />
          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}