import { Play } from "lucide-react";

import { Card } from "@/components/common/Card";
import type { Video } from "@/types";

export function VideoCard({ video }: { video: Video }) {
  return (
    <Card className="group h-full transition-shadow hover:shadow-lifted">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/85 backdrop-blur">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium tabular-nums">
          {video.duration}
        </span>
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 text-base font-semibold">{video.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{video.views} views</p>
      </div>
    </Card>
  );
}