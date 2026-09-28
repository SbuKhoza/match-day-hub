import { Clock, Play } from "lucide-react";

import { Card } from "@/components/common/Card";

/**
 * Horizontal media card (image left ~40%, text right) for the Fantasy news and
 * video carousels. `playable` overlays a play button on the image.
 */
export function MediaRowCard({
  image,
  alt,
  badge,
  title,
  description,
  meta,
  playable = false,
}: {
  image: string;
  alt: string;
  badge: string;
  title: string;
  description?: string;
  meta?: string;
  playable?: boolean;
}) {
  return (
    <Card className="group flex h-36 transition-shadow hover:shadow-lifted sm:h-40">
      <div className="relative w-[38%] shrink-0 overflow-hidden">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {playable ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/85 backdrop-blur">
              <Play className="h-4 w-4 fill-current" aria-hidden />
            </span>
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
        <span className="w-fit rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {badge}
        </span>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
        {description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
        ) : null}
        {meta ? (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden />
            {meta}
          </p>
        ) : null}
      </div>
    </Card>
  );
}