import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/common/PageHeader";
import { VideoCard } from "@/components/home/VideoCard";
import { contentService } from "@/services/contentService";

export function VideosScreen() {
  const { data } = useQuery({ queryKey: ["videos"], queryFn: () => contentService.listVideos() });

  return (
    <div>
      <PageHeader title="Videos" subtitle="Highlights, interviews and behind the scenes." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}