import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Horizontal, snap-scrolling carousel with dot pagination underneath.
 * Each direct child becomes one slide. Swiping / scrolling updates the
 * active dot by finding whichever slide is closest to the viewport centre.
 */
export function Carousel({
  children,
  itemClassName,
  trackClassName,
  showDots = true,
}: {
  children: ReactNode;
  /** Width classes applied to each slide, e.g. "w-[78%] sm:w-72". */
  itemClassName?: string;
  trackClassName?: string;
  showDots?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);

  const items = useMemo(() => Children.toArray(children).filter(isValidElement), [children]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateActive = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      itemRefs.current.forEach((el, index) => {
        if (!el) return;
        const itemCenter = el.offsetLeft + el.offsetWidth / 2;
        const distance = Math.abs(itemCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActive(closestIndex);
    };

    updateActive();
    track.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      track.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [items.length]);

  const scrollToIndex = (index: number) => {
    const el = itemRefs.current[index];
    const track = trackRef.current;
    if (!el || !track) return;
    track.scrollTo({
      left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div
        ref={trackRef}
        className={cn(
          "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0",
          trackClassName,
        )}
      >
        {items.map((child, index) => (
          <div
            key={index}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={cn("shrink-0 snap-start", itemClassName)}
          >
            {child}
          </div>
        ))}
      </div>

      {showDots && items.length > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-1.5" role="tablist">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-label={`Show slide ${index + 1}`}
              aria-selected={index === active}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === active ? "w-4 bg-foreground" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}