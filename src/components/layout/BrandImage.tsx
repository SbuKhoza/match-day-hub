import type { BrandImage as BrandImageData } from "@/services/brandingService";

/** Admin-uploaded brand image, sized by height and never stretched. */
export function BrandImage({
  image,
  alt,
  className = "h-9",
}: {
  image: BrandImageData;
  alt: string;
  className?: string;
}) {
  return <img src={image.url} alt={alt} className={`${className} w-auto max-w-full object-contain`} />;
}