import { useFantasySettings } from "@/hooks/useAdmin";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarClock,
  Newspaper,
  PlayCircle,
  Star,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

import { Carousel } from "@/components/common/Carousel";
import { LoadingState } from "@/components/common/DataState";
import { CompactEmpty } from "@/components/fantasy/CompactEmpty";
import { FantasyOnboarding } from "@/components/fantasy/FantasyOnboarding";
import { FantasySectionHead } from "@/components/fantasy/FantasySectionHead";
import { GameweekHero } from "@/components/fantasy/GameweekHero";
import { LeagueLeadersCard } from "@/components/fantasy/LeagueLeadersCard";
import { LeagueSummaryRow } from "@/components/fantasy/LeagueSummaryRow";
import { MediaRowCard } from "@/components/fantasy/MediaRowCard";
import { StatTile } from "@/components/fantasy/StatTile";
import { useAuth } from "@/hooks/useAuth";
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

/** Width of each carousel slide — under 100% so the next card peeks in. */
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
  const { profile, user } = useAuth();
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

  const transfersThisGw = transfers?.filter((t) => t.gameweek === gw).length ?? 0;

  return (
    <div className="-mt-3 space-y-5 sm:-mt-4">
      {/* 1. Gameweek dashboard when a team exists, onboarding otherwise */}
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      ) : team ? (
        <GameweekHero
          teamName={team.name}
          managerName={profile?.name ?? user?.displayName ?? undefined}
          gameweek={gameweek}
          gameweekPoints={gwResult?.total ?? 0}
          overallPoints={overall}
          budgetLeft={formatRand(remaining)}
        />
      ) : (
        <FantasyOnboarding />
      )}

      {/* 2. Transfers + gameweek / deadline */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/fantasy/transfers"
          className="home-card flex flex-col p-3.5 transition-colors hover:bg-white/[0.07]"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Transfers
          </p>
          <p className="mt-1 text-3xl font-bold leading-none tabular-nums">{transfersThisGw}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">made this GW</p>
          <p className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-medium text-primary">
            Manage transfers <ArrowRight className="h-3 w-3" aria-hidden />
          </p>
        </Link>

        <Link
          to="/fantasy/points"
          className="home-card flex flex-col p-3.5 transition-colors hover:bg-white/[0.07]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Gameweek
            </p>
            {gameweek ? (
              <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-medium capitalize">
                {gameweek.status}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-3xl font-bold leading-none tabular-nums">{gameweek ? gw : "—"}</p>
          <p className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-muted-foreground">
            <CalendarClock className="mt-px h-3 w-3 shrink-0" aria-hidden />
            {gameweek ? formatKickoff(gameweek.deadline) : "Fixtures not yet available"}
          </p>
          <p className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-medium text-primary">
            View points <ArrowRight className="h-3 w-3" aria-hidden />
          </p>
        </Link>
      </div>

      {/* 3. Mini-leagues */}
      <section>
        <FantasySectionHead title="Your mini-leagues" icon={Users} to="/fantasy/leagues" />
        {leagues && leagues.length > 0 ? (
          <div className="space-y-2.5">
            {leagues.slice(0, 3).map((league) => (
              <LeagueSummaryRow key={league.id} league={league} />
            ))}
          </div>
        ) : (
          <CompactEmpty
            icon={Users}
            title="No mini-leagues yet"
            description="Create or join a mini-league to compare with friends."
            action={
              <Link
                to="/fantasy/leagues"
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Go to leagues
              </Link>
            }
          />
        )}
      </section>

      {/* 4. League leaders */}
      <section>
        <FantasySectionHead title="League leaders" icon={Trophy} to="/stats" />
        <LeagueLeadersCard topScorer={topScorer} topAssist={topAssist} />
      </section>

      {/* 5. Fantasy news */}
      <section>
        <FantasySectionHead title="Fantasy news" icon={Newspaper} to="/news" />
        {fantasyNews.isLoading ? (
          <LoadingState label="Loading fantasy news…" />
        ) : !fantasyNews.data || fantasyNews.data.length === 0 ? (
          <CompactEmpty
            icon={Newspaper}
            title="No fantasy news available yet"
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

      {/* 6. Videos */}
      <section>
        <FantasySectionHead title="Videos" icon={PlayCircle} to="/videos" />
        {videos.isLoading ? (
          <LoadingState label="Loading videos…" />
        ) : !videos.data || videos.data.length === 0 ? (
          <CompactEmpty icon={PlayCircle} title="No videos available yet" />
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

      {/* Existing stat tiles + quick links, kept but tucked away. */}
      <details className="group home-card p-3">
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
                className="flex items-center gap-3 rounded-xl border border-white/10 p-3 transition-colors hover:bg-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
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