import { Link } from "@tanstack/react-router";
import { ArrowRight, Trophy } from "lucide-react";

/** Shown instead of the gameweek dashboard when the user has not created a fantasy team yet. */
export function FantasyOnboarding() {
  return (
    <section className="home-card relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent"
      />
      <Trophy
        aria-hidden
        className="pointer-events-none absolute -right-4 top-2 h-36 w-36 opacity-[0.06]"
      />
      <div className="relative flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.07]">
            <Trophy className="h-6 w-6 text-gold" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold uppercase tracking-wide">Fantasy</h1>
            <p className="text-[13px] text-muted-foreground">Build your squad. Compete. Win.</p>
          </div>
        </div>
        <Link
          to="/fantasy/team"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Create your team <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}