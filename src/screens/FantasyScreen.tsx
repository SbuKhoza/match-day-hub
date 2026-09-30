import { useFantasySettings } from "@/hooks/useAdmin";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  CalendarClock,
  Crown,
  Footprints,
  Hand,
  Minus,
  Newspaper,
  PlayCircle,
  Star,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

import { Carousel } from "@/components/common/Carousel";
import { Card } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { FantasyNavCard } from "@/components/fantasy/FantasyNavCard";
import { LeagueSummaryRow } from "@/components/fantasy/LeagueSummaryRow";
import { MediaRowCard } from "@/components/fantasy/MediaRowCard";
import { StatLeaderRow } from "@/components/fantasy/StatLeaderRow";
import { StatTile } from "@/components/fantasy/StatTile";
import {
  useFantasyTeam,
  useGameweek,
  useLeagues,
  usePlayerPoints,
  useTransfers,
} from "@/hooks/useFantasy";
import { useTopScorers } from "@/hooks/useSportsData";
import { contentService } from "@/services/contentService";
import { calculateGameweek, calculateOverall } from "@/services/scoringService";
import { formatKickoff, formatRand, relativeDay } from "@/utils/format";

/**
 * Banner decoration (right side): diagonal stripes + a faded trophy.
 * Lower opacity = more subtle. Use "opacity-0" to hide either without removing code.
 */
const BANNER_STRIPES_OPACITY = "opacity-[0.07]";
const BANNER_WATERMARK_OPACITY = "opacity-[0.06]";
const BANNER_WATERMARK_SIZE = "h-40 w-40 sm:h-52 sm:w-52";
const BANNER_WATERMARK_POSITION = "-right-4 top-1";

const STRIPE_MASK = "linear-gradient(to right, transparent, black 65%)";

/** Width of each carousel slide — under 100% so the next card peeks in, as in the design. */
const CAROUSEL_SLIDE = "w-[84%] sm:w-[28rem]";

const LINKS = [
  { to: "/fantasy/lineup", label: "My Line-up", icon: Users, hint: "Pick your XI and subs" },
  { to: "/fantasy/team", label: "Team Builder", icon: Users, hint: "Build your 17-player squad" },
  { to: "/fantasy/leagues", label: "My Leagues", icon: Trophy, hint: "Create, join and compare" },
  {
    to: "/fantasy/transfers",
    label: "Transfers",
    icon: ArrowLeftRight,
    hint: "Swap players in and out",
  },
  { to: "/fantasy/points", label: "Points", icon: Star, hint: "Gameweek and overall scoring" },
] as const;

export function FantasyScreen() {
  const { data: team, isLoading } = useFantasyTeam();
  const { data: leagues } = useLeagues();
  const { data: gameweek } = useGameweek();
  const { data: transfers } = useTransfers();
  const { data: points } = usePlayerPoints();

  const fantasyNews = useQuery({
    queryKey: ["news", "fantasy"],
    queryFn: () => contentService.listArticlesByCategory("fantasy", 6),
  });
  const videos = useQuery({ queryKey: ["videos"], queryFn: () => contentService.listVideos(6) });
  const scorers = useTopScorers("goals");
  const assists = useTopScorers("assists");

  const topScorer = [...scorers.rows].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))[0] ?? null;
  const topAssist =
    [...assists.rows].sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0))[0] ?? null;

  const gw = gameweek?.number ?? 0;
  const gwResult = team && points ? calculateGameweek(team, points, gw) : null;
  const overall = team && points ? calculateOverall(team, points) : 0;
  const { budget } = useFantasySettings();
  const remaining = budget - (team?.budgetSpent ?? 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Card className="relative">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-3/5 text-foreground ${BANNER_STRIPES_OPACITY}`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 18px, currentColor 18px 23px)",
            maskImage: STRIPE_MASK,
            WebkitMaskImage: STRIPE_MASK,
          }}
        />
        <Trophy
          aria-hidden
          className={`pointer-events-none absolute ${BANNER_WATERMARK_POSITION} ${BANNER_WATERMARK_SIZE} ${BANNER_WATERMARK_OPACITY}`}
        />
        <div className="relative flex items-center gap-3 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Trophy className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Fantasy</h1>
            <p className="text-[13px] text-muted-foreground">Build your squad. Compete. Win.</p>
          </div>
        </div>
      </Card>

      {/* Hub cards (2 × 2, also on mobile) */}
      <div className="grid grid-cols-2 gap-3">
        {isLoading ? (
          <div className="h-[76px] animate-pulse rounded-lg bg-muted" />
        ) : team ? (
          <FantasyNavCard
            to="/fantasy/lineup"
            icon={Users}
            label="My team"
            title={team.name}
            subtitle={`${team.squad.length} players · ${team.starters.length} starting · ${formatRand(team.budgetSpent)} spent`}
          />
        ) : (
          <FantasyNavCard
            to="/fantasy/team"
            icon={Users}
            label="My team"
            title="Build my team"
            subtitle="No squad yet — pick 17 players inside your budget."
          />
        )}

        <FantasyNavCard
          to="/fantasy/points"
          icon={CalendarClock}
          label={`Gameweek ${gw}`}
          subtitle={
            gameweek ? `Deadline ${formatKickoff(gameweek.deadline)}` : "Fixtures not yet available"
          }
          trailing={
            gameweek ? (
              <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[10px] font-medium capitalize">
                {gameweek.status}
              </span>
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Minus className="h-4 w-4" aria-hidden />
              </span>
            )
          }
        />

        <FantasyNavCard
          to="/fantasy/transfers"
          icon={ArrowLeftRight}
          label="Transfers"
          title={`${transfers?.filter((t) => t.gameweek === gw).length ?? 0} this GW`}
          subtitle="Swap players in and out"
        />

        <FantasyNavCard
          to="/fantasy/leagues"
          icon={Trophy}
          label="Latest league standings"
          subtitle="See how you and your friends are performing"
        />
      </div>

      <section>
        <SectionHeader title="Your mini-leagues" to="/fantasy/leagues" icon={Users} compact large />
        {leagues && leagues.length > 0 ? (
          <div className="space-y-3">
            {leagues.slice(0, 3).map((league) => (
              <LeagueSummaryRow key={league.id} league={league} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No mini-leagues yet"
            description="Create or join a mini-league to compare with friends."
            action={
              <Link
                to="/fantasy/leagues"
                className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Go to leagues
              </Link>
            }
          />
        )}
      </section>

      <section>
        <SectionHeader title="Fantasy news" to="/news" icon={Newspaper} compact large />
        {fantasyNews.isLoading ? (
          <LoadingState label="Loading fantasy news…" />
        ) : !fantasyNews.data || fantasyNews.data.length === 0 ? (
          <EmptyMessage
            title="No fantasy news yet."
            description="Fantasy tips and updates appear here once published."
          />
        ) : (
          <Carousel itemClassName={CAROUSEL_SLIDE}>
            {fantasyNews.data.map((article) => (
              <MediaRowCard
                key={article.id}
                image={article.image}
                alt={article.headline}
                badge="Fantasy"
                title={article.headline}
                description={article.description}
                meta={relativeDay(article.publishedAt)}
              />
            ))}
          </Carousel>
        )}
      </section>

      <section>
        <SectionHeader title="Videos" to="/videos" icon={PlayCircle} compact large />
        {videos.isLoading ? (
          <LoadingState label="Loading videos…" />
        ) : !videos.data || videos.data.length === 0 ? (
          <EmptyMessage title="No videos available yet." />
        ) : (
          <Carousel itemClassName={CAROUSEL_SLIDE}>
            {videos.data.map((video) => (
              <MediaRowCard
                key={video.id}
                image={video.thumbnail}
                alt={video.title}
                badge="Video"
                title={video.title}
                meta={video.publishedAt ? relativeDay(video.publishedAt) : video.duration}
                playable
              />
            ))}
          </Carousel>
        )}
      </section>

      <section className="space-y-3">
        <StatLeaderRow
          icon={Crown}
          label="Top Scorer"
          row={topScorer}
          value={topScorer?.goals}
          valueLabel="Goals"
          unavailableText="No statistics available"
        />
        <StatLeaderRow
          icon={Footprints}
          label="Top Assists"
          row={topAssist}
          value={topAssist?.assists}
          valueLabel="Assists"
          unavailableText="No statistics available"
        />
        <StatLeaderRow
          icon={Hand}
          label="Clean Sheets"
          row={null}
          valueLabel="Clean Sheets"
          unavailableText="Not published by the data provider yet"
        />
      </section>

      {/* Existing stat tiles + quick links, kept but tucked away so the screen matches the design. */}
      <details className="group rounded-lg border border-border p-3">
        <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground group-open:mb-4 group-open:text-foreground">
          More fantasy details
        </summary>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Gameweek points"
              value={String(gwResult?.total ?? 0)}
              icon={Trophy}
              hint={`GW ${gw}`}
            />
            <StatTile label="Overall points" value={String(overall)} icon={Star} />
            <StatTile label="Budget left" value={formatRand(remaining)} icon={Wallet} />
            <StatTile label="Mini-leagues" value={String(leagues?.length ?? 0)} icon={Users} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <link.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{link.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{link.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}