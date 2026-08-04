import { useQuery } from "@tanstack/react-query";

import { FavoriteTeamCard } from "@/components/home/FavoriteTeamCard";
import { NewsCarousel } from "@/components/home/NewsCarousel";
import { VideoCarousel } from "@/components/home/VideoCarousel";
import { SectionHeader } from "@/components/common/SectionHeader";
import { useAuth } from "@/hooks/useAuth";
import { contentService } from "@/services/contentService";

export function HomeScreen() {
  const { profile, user } = useAuth();
  const teamId = profile?.favoriteTeam ?? "mamelodi-sundowns";

  const { data } = useQuery({
    queryKey: ["home", teamId],
    queryFn: async () => {
      const [team, standing, matches, teamNews, leagueNews, fantasyNews, videos] = await Promise.all([
        contentService.getTeam(teamId),
        contentService.getStanding(teamId),
        contentService.getTeamMatches(teamId),
        contentService.listArticlesByCategory("team"),
        contentService.listArticlesByCategory("league"),
        contentService.listArticlesByCategory("fantasy"),
        contentService.listVideos(3),
      ]);
      return { team, standing, matches, teamNews, leagueNews, fantasyNews, videos };
    },
  });

  const firstName = (profile?.name ?? user?.displayName ?? "there").split(" ")[0];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{firstName}</h1>
      </header>

      {data?.team && data.standing && data.matches ? (
        <FavoriteTeamCard
          team={data.team}
          standing={data.standing}
          previous={data.matches.previous}
          next={data.matches.upcoming[0]!}
          live={data.matches.current}
        />
      ) : (
        <div className="h-44 animate-pulse rounded-3xl bg-muted" />
      )}

      <section>
        <SectionHeader
          title={data?.team ? `${data.team.name} news` : "Your club news"}
          subtitle="Latest on your favourite team"
          to="/news"
        />
        <NewsCarousel articles={data?.teamNews ?? []} />
      </section>

      <section>
        <SectionHeader title="Around the league" subtitle="News from every other PSL club" to="/news" />
        <NewsCarousel articles={data?.leagueNews ?? []} />
      </section>

      <section>
        <SectionHeader
          title="Fantasy news"
          subtitle="How the latest games change your fantasy side"
          to="/fantasy"
        />
        <NewsCarousel articles={data?.fantasyNews ?? []} />
      </section>

      <section>
        <SectionHeader title="Highlights" subtitle="Three minutes, all the goals" to="/videos" />
        <VideoCarousel videos={data?.videos ?? []} />
      </section>
    </div>
  );
}