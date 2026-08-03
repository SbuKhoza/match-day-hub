import { VideoCard } from "./VideoCard";
import type { Video } from "@/types";

export function VideoCarousel({ videos }: { videos: Video[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {videos.map((video) => (
        <div key={video.id} className="w-[85%] shrink-0 snap-start sm:w-[420px] lg:w-1/3">
          <VideoCard video={video} />
        </div>
      ))}
    </div>
  );
}