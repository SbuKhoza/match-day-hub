import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeftRight, CalendarClock, Shirt } from "lucide-react";

import type { Gameweek } from "@/types/fantasy";
import { formatKickoff } from "@/utils/format";

/**
 * Gameweek performance dashboard shown when the user already has a fantasy team.
 * Pure presentation: every value is passed in from data the Fantasy page already loads.
 */
export function GameweekHero({
  teamName,
  managerName,
  gameweek,
  gameweekPoints,
  overallPoints,
  budgetLeft,
}: {
  teamName: string;
  managerName?: string | undefined;
  gameweek: Gameweek | null | undefined;
  gameweekPoints: number;
  overallPoints: number;
  budgetLeft: string;
}) {
  return (
    <section className="home-card relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent"
      />
      <div className="relative space-y-4 p-4">
        <Link to="/fantasy/lineup" className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold leading-tight">{teamName}</span>
            {managerName ? (
              <span className="block truncate text-xs text-muted-foreground">{managerName}</span>
            ) : null}
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        </Link>

        <Link
          to="/fantasy/points"
          className="block border-y border-white/10 py-4"
          aria-label="View gameweek points"
        >
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {gameweek ? `Gameweek ${gameweek.number}` : "Gameweek"}
          </p>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">{overallPoints}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Overall</p>
            </div>
            <div className="text-center">
              <p className="text-6xl font-bold leading-none tabular-nums">{gameweekPoints}</p>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Points <ArrowRight className="h-3 w-3" aria-hidden />
              </p>
            </div>
            <div className="text-center">
              <p className="truncate text-2xl font-bold tabular-nums">{budgetLeft}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Budget left</p>
            </div>
          </div>
        </Link>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {gameweek ? (
            <span>
              Deadline{" "}
              <span className="font-semibold text-foreground">{formatKickoff(gameweek.deadline)}</span>
            </span>
          ) : (
            <span>Fixtures not yet available</span>
          )}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/fantasy/lineup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Shirt className="h-4 w-4" aria-hidden /> Pick team
          </Link>
          <Link
            to="/fantasy/transfers"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2.5 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden /> Transfers
          </Link>
        </div>
      </div>
    </section>
  );
}