import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Header for Fantasy sub-pages: back button to the Fantasy hub, title, subtitle and an optional right slot. */
export function FantasySubHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-start gap-3">
      <Link
        to="/fantasy"
        aria-label="Back to Fantasy"
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/10 transition-colors hover:bg-white/10"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold leading-tight">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </header>
  );
}