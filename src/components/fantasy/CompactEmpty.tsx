import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Small empty state (roughly 90–130px tall) so empty sections never dominate the page. */
export function CompactEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="home-card flex items-center gap-3 px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}