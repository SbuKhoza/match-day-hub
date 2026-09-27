import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Handshake, Newspaper, PlayCircle, ShieldCheck, Target } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { LiveDataFooter } from "@/components/common/LiveDataFooter";
import { SectionHeader } from "@/components/common/SectionHeader";
import { TeamBadge } from "@/components/common/TeamBadge";
import { FixtureSummaryCard } from "@/components/home/FixtureSummaryCard";
import { NewsCarousel } from "@/components/home/NewsCarousel";
import { StatLeaderCarousel } from "@/components/home/StatLeaderCarousel";
import { VideoCarousel } from "@/components/home/VideoCarousel";
import { MatchCard } from "@/components/match/MatchCard";
import { StatTile } from "@/components/fantasy/StatTile";
import { useAuth } from "@/hooks/useAuth";
import { usePlayers, useTeam } from "@/hooks/useMasterData";
import { useStandings, useTeamMatches, useTopScorers } from "@/hooks/useSportsData";
import { contentService } from "@/services/contentService";

/**
 * Opacity of the faded club-crest watermark on the "Your club" card.
 * Lower = more subtle / easier to read the badge & text over it.
 * Change this one value to adjust it — e.g. "opacity-[0.15]" for a bolder
 * watermark, or "opacity-0" to switch it off entirely without removing the code.
 */
const CLUB_BACKGROUND_OPACITY = "opacity-[0.1]";

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

  // Master player list, used only to resolve a data-provider slug (e.g. from the
  // scorers/assists feed) to this app's own player id, so leaderboard rows can
  // link through to /players/$playerId. Players without a mapped slug simply
  // render as non-clickable rows in the carousel.
  const players = usePlayers();
  const playerIdBySlug = useMemo(() => {
    const map: Record<string, string> = {};
    for (const player of players.data ?? []) {
      if (player.sportscoreSlug) map[player.sportscoreSlug] = player.playerId;
    }
    return map;
  }, [players.data]);

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

  return (
    <div className="space-y-8">
      {/*
        Header + favourite-club card grouped in their own tighter `space-y-3`
        wrapper so the gap between the greeting and the club card is smaller
        than the gap between the other sections below (space-y-8 on the
        outer div). Increase this value (e.g. space-y-6) for more breathing
        room between the two.
      */}
      <div className="space-y-3">
        <header>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">{firstName}</h1>
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
          <section className="space-y-3">
            <Card className="relative">
              {clubBackgroundImage ? (
                // Faded crest watermark. Purely decorative (aria-hidden) and
                // pushed further into the top-right corner than the visible
                // team badge below, so it never sits behind/over the badge.
                // Opacity is controlled by CLUB_BACKGROUND_OPACITY above.
                <img
                  src={clubBackgroundImage}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className={`pointer-events-none absolute -right-14 -top-14 h-44 w-44 rotate-6 object-contain blur-[1px] sm:h-52 sm:w-52 ${CLUB_BACKGROUND_OPACITY}`}
                />
              ) : null}

              <CardBody className="relative space-y-4 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <TeamBadge
                    team={{
                      name: favourite.data.teamName,
                      shortName: favourite.data.shortName,
                      logo: clubBackgroundImage,
                    }}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Your club
                    </p>
                    <h2 className="truncate text-lg font-semibold sm:text-xl">
                      {favourite.data.teamName}
                    </h2>
                  </div>
                  <Link
                    to="/profile"
                    className="ml-auto shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatTile label="Position" value={row ? String(row.position) : "—"} />
                  <StatTile label="Points" value={row ? String(row.points) : "—"} />
                </div>
              </CardBody>
            </Card>

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
                    <FixtureSummaryCard
                      label="Last match"
                      match={previous ?? null}
                      teamSlug={slug}
                    />
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
        )}
      </div>

      <section>
        <SectionHeader title="News" to="/news" icon={Newspaper} compact />
        {articles.isLoading ? (
          <LoadingState label="Loading the latest news…" />
        ) : !articles.data || articles.data.length === 0 ? (
          <EmptyMessage
            title="No news available yet."
            description="Articles appear here once a news source is connected."
          />
        ) : (
          <NewsCarousel articles={articles.data} />
        )}
      </section>

      <section>
        <SectionHeader title="Videos" to="/videos" icon={PlayCircle} compact />
        {videos.isLoading ? (
          <LoadingState label="Loading videos…" />
        ) : !videos.data || videos.data.length === 0 ? (
          <EmptyMessage
            title="No videos available yet."
            description="Clips appear here once a video source is connected."
          />
        ) : (
          <VideoCarousel videos={videos.data} />
        )}
      </section>

      <section>
        <SectionHeader
          title="Top scorer"
          to="/match-center"
          linkLabel="See all"
          icon={Target}
          compact
        />
        {scorers.isLoading ? (
          <LoadingState label="Loading top scorers…" />
        ) : scorers.rows.length === 0 ? (
          <EmptyMessage title="No statistics available." />
        ) : (
          <StatLeaderCarousel
            rows={scorers.rows}
            valueKey="goals"
            valueLabel="Goals"
            playerIdBySlug={playerIdBySlug}
          />
        )}
        <LiveDataFooter meta={scorers.meta} />
      </section>

      <section>
        <SectionHeader
          title="Assists"
          to="/match-center"
          linkLabel="See all"
          icon={Handshake}
          compact
        />
        {assists.isLoading ? (
          <LoadingState label="Loading assists…" />
        ) : assists.rows.length === 0 ? (
          <EmptyMessage title="No statistics available." />
        ) : (
          <StatLeaderCarousel
            rows={assists.rows}
            valueKey="assists"
            valueLabel="Assists"
            playerIdBySlug={playerIdBySlug}
          />
        )}
        <LiveDataFooter meta={assists.meta} />
      </section>

      <section>
        <SectionHeader title="Clean sheets" icon={ShieldCheck} compact />
        <EmptyMessage
          title="Clean sheet leaders aren't available yet."
          description="This data provider doesn't publish goalkeeper stats — it can be added here once a source is connected."
        />
      </section>

      <section>
        <SectionHeader
          title="League table"
          subtitle="Live Premier Soccer League standings"
          to="/match-center"
        />
        {standings.isLoading ? (
          <LoadingState label="Loading the league table…" />
        ) : standings.rows.length === 0 ? (
          <EmptyMessage title="No standings available." />
        ) : (
          <Card>
            <CardBody className="p-4">
              <ul className="space-y-2 text-sm">
                {standings.rows.slice(0, 5).map((entry) => (
                  <li key={entry.team.slug} className="flex items-center gap-3">
                    <span className="w-5 text-right tabular-nums text-muted-foreground">
                      {entry.position}
                    </span>
                    <TeamBadge team={entry.team} size="sm" className="h-7 w-7" />
                    <span className="min-w-0 flex-1 truncate">{entry.team.name}</span>
                    <span className="tabular-nums font-semibold">{entry.points}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
        <LiveDataFooter meta={standings.meta} />
      </section>
    </div>
  );
}