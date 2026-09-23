import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { LiveDataFooter } from "@/components/common/LiveDataFooter";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/fantasy/StatTile";
import { usePlayer } from "@/hooks/useMasterData";
import { useProviderPlayer } from "@/hooks/useSportsData";
import { formatRand } from "@/utils/format";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function PlayerProfileScreen({ playerId }: { playerId: string }) {
  const { data: player, isLoading } = usePlayer(playerId);
  // Statistics are only fetched when this player has been reliably linked
  // to the football data provider — never by guessing at a name.
  const provider = useProviderPlayer(player?.sportscoreSlug ?? null);

  if (isLoading) return <LoadingState label="Loading player…" />;
  if (!player) {
    return (
      <div className="space-y-4">
        <PageHeader title="Player not found" subtitle="This player is not in the database." />
        <Link to="/players" className="text-sm font-medium underline">
          Back to players
        </Link>
      </div>
    );
  }

  const stats = provider.stats;

  return (
    <div className="space-y-6">
      <Link
        to="/players"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Players
      </Link>

      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{player.playerName}</h1>
        <p className="text-sm text-muted-foreground">
          {player.teamName} · {player.position ?? "Position not recorded"}
        </p>
      </div>

      <Card>
        <CardBody className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <Detail label="Shirt number" value={player.shirtNumber === null ? "—" : String(player.shirtNumber)} />
          <Detail label="Nationality" value={player.nationality ?? "—"} />
          <Detail label="Date of birth" value={player.dateOfBirth ?? "—"} />
          <Detail label="Status" value={player.status} />
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Fantasy price"
          value={player.fantasyPrice === null ? "Not set" : formatRand(player.fantasyPrice)}
        />
        <StatTile label="Fantasy points" value={String(player.fantasyPoints)} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Season statistics</h2>
        {!player.sportscoreSlug ? (
          <EmptyMessage
            title="Statistics unavailable."
            description="This player has not been linked to the statistics provider yet, so no numbers are shown rather than guessed ones."
          />
        ) : provider.isLoading ? (
          <LoadingState label="Loading statistics…" />
        ) : !stats ? (
          <EmptyMessage title="Statistics unavailable." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="Apps" value={String(stats.matches ?? "—")} />
              <StatTile label="Minutes" value={String(stats.minutes ?? "—")} />
              <StatTile label="Goals" value={String(stats.goals ?? "—")} />
              <StatTile label="Assists" value={String(stats.assists ?? "—")} />
              <StatTile label="Yellow cards" value={String(stats.yellow_cards ?? "—")} />
              <StatTile label="Red cards" value={String(stats.red_cards ?? "—")} />
            </div>
            <LiveDataFooter />
          </>
        )}
      </section>
    </div>
  );
}
