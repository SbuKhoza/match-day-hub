import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, CalendarDays, Info, ListOrdered, Newspaper, PlayCircle, ShieldCheck, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { LiveDataFooter } from "@/components/common/LiveDataFooter";
import { TeamBadge } from "@/components/common/TeamBadge";
import { FixtureSummaryCard } from "@/components/home/FixtureSummaryCard";
import { NewsCarousel } from "@/components/home/NewsCarousel";
import { StatLeaderCarousel } from "@/components/home/StatLeaderCarousel";
import { VideoCarousel } from "@/components/home/VideoCarousel";
import { MatchCard } from "@/components/match/MatchCard";
import { useAuth } from "@/hooks/useAuth";
import { useTeam } from "@/hooks/useMasterData";
import { useStandings, useTeamMatches, useTopScorers } from "@/hooks/useSportsData";
import { contentService } from "@/services/contentService";

/**
 * Opacity of the faded club-crest watermark on the "Your club" card.
 * Lower = more subtle / easier to read the badge & text over it.
 * Change this one value to adjust it — e.g. "opacity-[0.15]" for a bolder
 * watermark, or "opacity-0" to switch it off entirely without removing the code.
 */
const CLUB_BACKGROUND_OPACITY = "opacity-[0.05]";

/**
 * Size of the club-crest watermark (mobile, then `sm:` breakpoint).
 * Increase/decrease these two values together to scale it up or down.
 */
const CLUB_BACKGROUND_SIZE = "h-60 w-60 sm:h-72 sm:w-72";

/**
 * Position of the club-crest watermark, as Tailwind inset utilities.
 * Kept in the top-right corner but nudged down from the very top edge
 * (`top-4` instead of a negative offset) so it sits slightly lower over the
 * card. Increase `top-*` to push it further down, or use a negative value
 * (e.g. `-top-14`) to pull it back up above the card edge.
 */
const CLUB_BACKGROUND_POSITION = "-right-14 top-4";

export function HomeScreen() {
  const { profile, user } = useAuth();
  const firstName = (profile?.name ?? user?.displayName ?? "there").split(" ")[0];

  const favourite = useTeam(profile?.favoriteTeam ?? null);
  const slug = favourite.data?.sportscoreSlug ?? null;

  const standings = useStandings();
  const teamMatches = useTeamMatches(slug);

  const articles = useQuery({ queryKey: ["news"], queryFn: () => contentService.listArticles(6) });
  const videos = useQuery({ queryKey: ["videos"], queryFn: () => contentService.listVideos(6) });
  const scorers = useTopScorers("goals");
  const assists = useTopScorers("assists");

  const row = standings.rows.find((entry) => entry.team.slug === slug);
  // Optional faded backdrop for the club card — the club's own crest, when one is available.
  const clubBackgroundImage = favourite.data?.logo ?? row?.team.logo ?? null;
  const live = teamMatches.matches.filter((match) => match.status === "live");
  const previous = teamMatches.matches
    .filter((match) => match.status === "finished")
    .sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""))[0];
  const next = teamMatches.matches
    .filter((match) => match.status === "upcoming")
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))[0];

  const [leaderTab, setLeaderTab] = useState<"goals" | "assists" | "clean">("goals");
  const leaderData = leaderTab === "assists" ? assists : scorers;

  return (
    <div className="-mt-3 space-y-6 sm:-mt-4">
      <div className="space-y-3">
        <header>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-bold leading-tight">{firstName}</h1>
        </header>

        {!profile?.favoriteTeam || !favourite.data ? (
          <EmptyMessage
            title="No club selected yet."
            description="Choose your club once the club list has been imported, and your results and fixtures appear here."
            action={
              <Link to="/profile" className="text-sm font-medium underline">
                Go to profile
              </Link>
            }
          />
        ) : (
          <div className="home-card relative overflow-hidden">
            {clubBackgroundImage ? (
              <img
                src={clubBackgroundImage}
                alt=""
                aria-hidden
                loading="lazy"
                className={`pointer-events-none absolute object-contain ${CLUB_BACKGROUND_POSITION} ${CLUB_BACKGROUND_SIZE} ${CLUB_BACKGROUND_OPACITY}`}
              />
            ) : null}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gold/70" aria-hidden />
            <div className="relative flex items-center gap-4 p-4">
              <TeamBadge
                team={{
                  name: favourite.data.teamName,
                  shortName: favourite.data.shortName,
                  logo: clubBackgroundImage,
                }}
                size="xl"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Your club
                    </p>
                    <h2 className="truncate text-lg font-semibold">{favourite.data.teamName}</h2>
                  </div>
                  <Link
                    to="/profile"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Change <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-3 grid grid-cols-2 border-t border-white/10 pt-3">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{row ? `#${row.position}` : "—"}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Position</p>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <p className="text-2xl font-bold tabular-nums">{row ? row.points : "—"}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {profile?.favoriteTeam && favourite.data ? (
        <section>
          <HomeSectionHead title="Matches" icon={CalendarDays} to={slug ? "/match-center" : undefined} />
          {!slug ? (
            <EmptyMessage
              title="This club is not linked to the live data feed yet."
              description="Add the club's data-provider reference in the import file to see fixtures and results."
            />
          ) : teamMatches.isLoading ? (
            <LoadingState label="Loading your club's matches…" />
          ) : (
            <div className="space-y-3">
              {live.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {live.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : null}
              {previous || next ? (
                <div className="grid grid-cols-2 gap-3">
                  <FixtureSummaryCard label="Last match" match={previous ?? null} teamSlug={slug} />
                  <FixtureSummaryCard
                    label="Next fixture"
                    match={next ?? null}
                    teamSlug={slug}
                    variant="fixture"
                  />
                </div>
              ) : live.length === 0 ? (
                <EmptyMessage title="No fixtures available." />
              ) : null}
            </div>
          )}
          <LiveDataFooter meta={teamMatches.meta} />
        </section>
      ) : null}

      <section>
        <HomeSectionHead title="League leaders" icon={Trophy} to="/stats" />
        <div role="tablist" aria-label="League leaders" className="mb-3 inline-flex rounded-full bg-white/5 p-1 ring-1 ring-white/10">
          {(
            [
              ["goals", "Goals"],
              ["assists", "Assists"],
              ["clean", "Clean sheets"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={leaderTab === key}
              onClick={() => setLeaderTab(key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                leaderTab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {leaderTab === "clean" ? (
          <CompactNotice
            title="Clean sheet leaders aren't available yet."
            description="This data provider doesn't publish goalkeeper stats — it can be added here once a source is connected."
          />
        ) : leaderData.isLoading ? (
          <LoadingState label={leaderTab === "goals" ? "Loading top scorers…" : "Loading assists…"} />
        ) : leaderData.rows.length === 0 ? (
          <EmptyMessage title="No statistics available." />
        ) : (
          <StatLeaderCarousel
            key={leaderTab}
            rows={leaderData.rows}
            valueKey={leaderTab}
            valueLabel={leaderTab === "goals" ? "Goals" : "Assists"}
          />
        )}
        {leaderTab !== "clean" ? <LiveDataFooter meta={leaderData.meta} /> : null}
      </section>

      <section>
        <HomeSectionHead
          title="League table"
          subtitle="Live Premier Soccer League"
          icon={ListOrdered}
          to="/match-center"
        />
        {standings.isLoading ? (
          <LoadingState label="Loading the league table…" />
        ) : standings.rows.length === 0 ? (
          <EmptyMessage title="No standings available." />
        ) : (
          <div className="home-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="w-5 text-center">#</span>
              <span className="w-7" />
              <span className="flex-1">Club</span>
              <span>Pts</span>
            </div>
            <ul className="text-sm">
              {standings.rows.slice(0, 5).map((entry) => {
                const mine = entry.team.slug === slug;
                return (
                  <li
                    key={entry.team.slug}
                    className={`flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-b-0 ${
                      mine ? "border-l-2 border-l-gold bg-gold/10" : ""
                    }`}
                  >
                    <span className="w-5 text-center font-semibold tabular-nums">{entry.position}</span>
                    <TeamBadge team={entry.team} size="sm" className="h-7 w-7" />
                    <span className={`min-w-0 flex-1 truncate ${mine ? "text-gold" : ""}`}>
                      {entry.team.name}
                    </span>
                    <span className={`font-bold tabular-nums ${mine ? "text-gold" : ""}`}>
                      {entry.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <LiveDataFooter meta={standings.meta} />
      </section>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-3">
        <section className="min-w-0">
          <HomeSectionHead title="News" icon={Newspaper} to="/news" />
          {articles.isLoading ? (
            <LoadingState label="Loading the latest news…" />
          ) : !articles.data || articles.data.length === 0 ? (
            <CompactEmpty
              icon={Newspaper}
              title="No news available yet."
              description="Articles appear here once a news source is connected."
            />
          ) : (
            <NewsCarousel articles={articles.data} />
          )}
        </section>
        <section className="min-w-0">
          <HomeSectionHead title="Videos" icon={PlayCircle} to="/videos" />
          {videos.isLoading ? (
            <LoadingState label="Loading videos…" />
          ) : !videos.data || videos.data.length === 0 ? (
            <CompactEmpty
              icon={PlayCircle}
              title="No videos available yet."
              description="Clips appear here once a video source is connected."
            />
          ) : (
            <VideoCarousel videos={videos.data} />
          )}
        </section>
      </div>

      <section>
        <HomeSectionHead title="Clean sheets" icon={ShieldCheck} />
        <CompactNotice
          title="Clean sheet leaders aren't available yet."
          description="This data provider doesn't publish goalkeeper stats — it can be added here once a source is connected."
        />
      </section>
    </div>
  );
}

function HomeSectionHead({
  title,
  subtitle,
  icon: Icon,
  to,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  to?: string;
}) {
  return (
    <div className="mb-2.5 flex items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {to ? (
        <Link
          to={to as never}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function CompactEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="home-card flex flex-col items-center justify-center gap-1.5 px-4 py-4 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function CompactNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="home-card flex items-start gap-3 px-4 py-3.5">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
