import { useQuery } from "@tanstack/react-query";

import { FavoriteTeamCard } from "@/components/home/FavoriteTeamCard";
import { NewsCard } from "@/components/home/NewsCard";
import { VideoCarousel } from "@/components/home/VideoCarousel";
import { SectionHeader } from "@/components/common/SectionHeader";
import { useAuth } from "@/hooks/useAuth";
import { contentService } from "@/services/contentService";

export function HomeScreen() {
  const { profile, user } = useAuth();
  const teamId = profile?.favoriteTeam ?? "arsenal";

  const { data } = useQuery({
    queryKey: ["home", teamId],
    queryFn: async () => {
      const [team, standing, matches, articles, videos] = await Promise.all([
        contentService.getTeam(teamId),
        contentService.getStanding(teamId),
        contentService.getTeamMatches(teamId),
        contentService.listArticles(5),
        contentService.listVideos(3),
      ]);
      return { team, standing, matches, articles, videos };
    },
  });

  const firstName = (profile?.name ?? user?.displayName ?? "there").split(" ")[0];

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{firstName}</h1>
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
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      )}

      <section>
        <SectionHeader title="Latest news" subtitle="Handpicked stories for your club" to="/news" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data?.articles ?? []).map((article, index) => (
            <div key={article.id} className={index === 0 ? "md:col-span-2 lg:col-span-2" : ""}>
              <NewsCard article={article} featured={index === 0} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Highlights" subtitle="Three minutes, all the goals" to="/videos" />
        <VideoCarousel videos={data?.videos ?? []} />
      </section>
    </div>
  );
}