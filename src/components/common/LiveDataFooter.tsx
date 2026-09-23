import { SPORTS_API } from "@/config/sportsApi";
import type { LiveDataMeta } from "@/hooks/useSportsData";

function sinceLabel(fetchedAt: number | null): string {
  if (!fetchedAt) return "Not updated yet";
  const minutes = Math.floor((Date.now() - fetchedAt) / 60_000);
  if (minutes <= 0) return "Updated just now";
  if (minutes === 1) return "Updated 1 minute ago";
  if (minutes < 60) return `Updated ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "Updated 1 hour ago" : `Updated ${hours} hours ago`;
}

/** Last-updated indicator plus the attribution the data provider requires. */
export function LiveDataFooter({ meta }: { meta?: LiveDataMeta }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
      {meta ? (
        <span role="status">
          {sinceLabel(meta.fetchedAt)}
          {meta.stale ? " · showing the last update we received" : ""}
        </span>
      ) : null}
      <a
        href={SPORTS_API.attributionUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Powered by SportScore
      </a>
    </div>
  );
}
