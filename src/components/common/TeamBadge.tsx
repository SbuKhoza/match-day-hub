import { cn } from "@/lib/utils";
import type { Team } from "@/types";

const sizes = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-xl",
};

export function TeamBadge({
  team,
  size = "md",
  className,
}: {
  team: Pick<Team, "shortName" | "name"> & { primary?: string };
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-label={team.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary font-semibold tracking-tight text-secondary-foreground",
        sizes[size],
        className,
      )}
      style={
        team.primary
          ? { boxShadow: `inset 0 -3px 0 0 ${team.primary}` }
          : undefined
      }
    >
      {team.shortName}
    </span>
  );
}