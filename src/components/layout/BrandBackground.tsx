import type { BrandImage } from "@/services/brandingService";

/**
 * Fills a navigation bar with an admin-uploaded image. The parent must be
 * positioned (fixed/sticky/relative) with overflow hidden, and its content
 * should be `relative` so it sits above the image.
 */
export function BrandBackground({ image }: { image: BrandImage | null }) {
  if (!image) return null;
  return (
    <>
      <img
        src={image.url}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-background/60" />
    </>
  );
}