import { Carousel } from "@/components/common/Carousel";
import { VideoCard } from "./VideoCard";
import type { Video } from "@/types";

export function VideoCarousel({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return (
      <div className="flex gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-56 w-[85%] shrink-0 animate-pulse rounded-3xl bg-muted sm:w-[420px]"
          />
        ))}
      </div>
    );
  }

  return (
    <Carousel itemClassName="w-[85%] sm:w-[420px] lg:w-1/3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </Carousel>
  );
}