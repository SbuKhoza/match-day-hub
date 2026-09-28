import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  to,
  linkLabel = "View all",
  icon: Icon,
  compact = false,
  large = false,
}: {
  title: string;
  subtitle?: string;
  to?: string;
  /** Text for the trailing link, e.g. "See all". Defaults to "View all". */
  linkLabel?: string;
  /** Optional small icon shown before the title (used for compact home-screen sections). */
  icon?: LucideIcon;
  /** Tighter, single-row layout with a small text link instead of a pill button. */
  compact?: boolean;
  /** With `compact`: larger sentence-case title and icon (used on the Fantasy screen). */
  large?: boolean;
}) {
  if (compact) {
    return (
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon className={large ? "h-5 w-5" : "h-4 w-4 text-muted-foreground"} aria-hidden />
          ) : null}
          <h2
            className={
              large
                ? "text-base font-semibold"
                : "text-[13px] font-semibold uppercase tracking-wide"
            }
          >
            {title}
          </h2>
        </div>
        {to ? (
          <Link
            to={to as never}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {linkLabel}
            {large ? <ChevronRight className="h-4 w-4" /> : <ArrowRight className="h-3.5 w-3.5" />}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {to ? (
        <Link
          to={to as never}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}