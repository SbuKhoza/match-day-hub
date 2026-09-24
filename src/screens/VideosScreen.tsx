import { useQuery } from "@tanstack/react-query";

import { EmptyMessage } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { VideoCard } from "@/components/home/VideoCard";
import { contentService } from "@/services/contentService";

export function VideosScreen() {
  const { data } = useQuery({ queryKey: ["videos"], queryFn: () => contentService.listVideos() });
  const videos = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Videos" subtitle="Highlights, interviews and behind the scenes." />
      {videos.length === 0 ? (
        <EmptyMessage
          title="No videos available yet."
          description="Clips appear here once a video source is connected."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
