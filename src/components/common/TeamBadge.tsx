import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-xl",
};

export interface BadgeTeam {
  name: string;
  shortName?: string | null;
  logo?: string | null;
}

export function TeamBadge({
  team,
  size = "md",
  className,
}: {
  team: BadgeTeam;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-label={team.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary font-semibold tracking-tight text-secondary-foreground",
        sizes[size],
        className,
      )}
    >
      {team.logo ? (
        <img
          src={team.logo}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        (team.shortName ?? team.name.slice(0, 3).toUpperCase())
      )}
    </span>
  );
}
