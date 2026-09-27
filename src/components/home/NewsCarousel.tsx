import { Carousel } from "@/components/common/Carousel";
import { NewsCard } from "./NewsCard";
import type { Article } from "@/types";

export function NewsCarousel({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-52 w-[78%] shrink-0 animate-pulse rounded-3xl bg-muted sm:w-72"
          />
        ))}
      </div>
    );
  }

  return (
    <Carousel itemClassName="w-[78%] sm:w-72">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </Carousel>
  );
}