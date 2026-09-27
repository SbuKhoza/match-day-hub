import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { LiveDataFooter } from "@/components/common/LiveDataFooter";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/fantasy/StatTile";
import { usePlayers } from "@/hooks/useMasterData";
import { useProviderPlayer } from "@/hooks/useSportsData";
import { PlayerProfileScreen } from "./PlayerProfileScreen";

/**
 * Entry point for "player" links that only carry a data-provider slug (the
 * Top Scorer / Assists carousels on the home screen, for example) rather
 * than this app's own master-data player id.
 *
 * - If the slug matches a player already imported into master data, this
 *   hands off to the full PlayerProfileScreen (shirt number, fantasy price,
 *   season stats, etc).
 * - Otherwise it falls back to a lightweight profile built entirely from the
 *   live data provider, so the link always resolves to a real profile
 *   instead of doing nothing when a player hasn't been imported/linked yet.
 */
export function PlayerBySlugScreen({ slug }: { slug: string }) {
  const players = usePlayers();
  const matched = players.data?.find((player) => player.sportscoreSlug === slug);

  if (players.isLoading) return <LoadingState label="Loading player…" />;
  if (matched) return <PlayerProfileScreen playerId={matched.playerId} />;
  return <ProviderOnlyProfile slug={slug} />;
}

function ProviderOnlyProfile({ slug }: { slug: string }) {
  const provider = useProviderPlayer(slug);
  const stats = provider.stats;

  if (provider.isLoading) return <LoadingState label="Loading player…" />;

  if (!provider.profile) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Player not found"
          subtitle="No profile is available for this player yet."
        />
        <Link to="/stats" className="text-sm font-medium underline">
          Back to Stats
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/stats"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Stats
      </Link>

      <div className="flex items-center gap-3">
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-secondary">
          {provider.profile.logo ? (
            <img
              src={provider.profile.logo}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : null}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold sm:text-3xl">
            {provider.profile.name ?? "Unknown player"}
          </h1>
          {stats?.team ? (
            <p className="truncate text-sm text-muted-foreground">{stats.team}</p>
          ) : null}
        </div>
      </div>

      {!stats ? (
        <EmptyMessage
          title="Statistics unavailable."
          description="The live data provider hasn't published season stats for this player yet."
        />
      ) : (
        <>
          <Card>
            <CardBody className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              <StatTile label="Apps" value={String(stats.matches ?? "—")} />
              <StatTile label="Minutes" value={String(stats.minutes ?? "—")} />
              <StatTile label="Goals" value={String(stats.goals ?? "—")} />
              <StatTile label="Assists" value={String(stats.assists ?? "—")} />
              <StatTile label="Yellow cards" value={String(stats.yellow_cards ?? "—")} />
              <StatTile label="Red cards" value={String(stats.red_cards ?? "—")} />
            </CardBody>
          </Card>
          <LiveDataFooter />
        </>
      )}
    </div>
  );
}