import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  to,
  linkLabel = "View all",
  icon: Icon,
  compact = false,
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
}) {
  if (compact) {
    return (
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
          <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
        </div>
        {to ? (
          <Link
            to={to as never}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {linkLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {to ? (
        <Link
          to={to as never}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}