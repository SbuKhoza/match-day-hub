import { NewsCard } from "./NewsCard";
import type { Article } from "@/types";

export function NewsCarousel({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-52 w-[78%] shrink-0 animate-pulse rounded-3xl bg-muted sm:w-72" />
        ))}
      </div>
    );
  }

  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {articles.map((article) => (
        <div key={article.id} className="w-[78%] shrink-0 snap-start sm:w-72">
          <NewsCard article={article} />
        </div>
      ))}
    </div>
  );
}