import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Compact uppercase section title with an optional "View all" link (matches the PSL Home page). */
export function FantasySectionHead({
  title,
  icon: Icon,
  to,
  linkLabel = "View all",
}: {
  title: string;
  icon: LucideIcon;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        {title}
      </h2>
      {to ? (
        <Link
          to={to as never}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
        >
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}