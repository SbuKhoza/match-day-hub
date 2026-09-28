import { Link } from "@tanstack/react-router";

import { Carousel } from "@/components/common/Carousel";
import { Card, CardBody } from "@/components/common/Card";
import { TeamBadge } from "@/components/common/TeamBadge";
import type { NormalizedScorer } from "@/services/sportscore/normalize";

export function StatLeaderCarousel({
  rows,
  valueKey,
  valueLabel,
}: {
  rows: NormalizedScorer[];
  valueKey: "goals" | "assists";
  valueLabel: string;
}) {
  const leaders = rows
    .filter((row) => row[valueKey] !== null)
    .sort((a, b) => (b[valueKey] ?? 0) - (a[valueKey] ?? 0))
    .slice(0, 5);

  if (leaders.length === 0) return null;

  return (
    <Carousel itemClassName="w-full">
      {leaders.map((row) => (
        // Every row links to a player profile: /players/provider/$slug resolves
        // this data-provider slug to our own master-data player when one is
        // linked, and otherwise falls back to a provider-only profile — so the
        // card is always clickable, never a dead end. See PlayerBySlugScreen.
        <Link key={row.playerSlug} to="/players/provider/$slug" params={{ slug: row.playerSlug }}>
          <Card className="transition-shadow hover:shadow-lifted">
            <CardBody className="flex items-center gap-3 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold tabular-nums">
                {row.rank}
              </span>

              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-secondary">
                {row.photo ? (
                  <img
                    src={row.photo}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.playerName}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {row.teamSlug ? (
                    <TeamBadge
                      team={{ name: row.teamName, logo: row.teamLogo }}
                      size="sm"
                      className="h-4 w-4 rounded-md border-0 bg-transparent p-0"
                    />
                  ) : null}
                  <span className="truncate">{row.teamName}</span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums">{row[valueKey]}</p>
                <p className="text-[11px] text-muted-foreground">{valueLabel}</p>
              </div>
            </CardBody>
          </Card>
        </Link>
      ))}
    </Carousel>
  );
}