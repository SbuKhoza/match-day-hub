import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/common/Card";
import { cn } from "@/lib/utils";

/**
 * Compact tappable hub card: round icon, small uppercase label, bold title,
 * muted subtitle, chevron (or a custom trailing element).
 * `emphasis` renders the title as a large number (e.g. total points).
 */
export function FantasyNavCard({
  to,
  icon: Icon,
  label,
  title,
  subtitle,
  trailing,
  emphasis = false,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  title?: string;
  subtitle?: string;
  trailing?: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <Link to={to as never} className="block h-full">
      <Card className="h-full transition-shadow hover:shadow-lifted">
        <div className="flex h-full items-center gap-2.5 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
              {label}
            </p>
            {title ? (
              <p
                className={cn(
                  "truncate font-semibold",
                  emphasis ? "text-xl leading-tight" : "text-sm",
                )}
              >
                {title}
              </p>
            ) : null}
            {subtitle ? (
              <p className="line-clamp-3 text-[11px] leading-snug text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          {trailing ?? (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </div>
      </Card>
    </Link>
  );
}