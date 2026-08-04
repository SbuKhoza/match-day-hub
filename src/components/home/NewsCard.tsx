import { Card } from "@/components/common/Card";
import type { Article } from "@/types";
import { relativeDay } from "@/utils/format";

export function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-lifted">
      <div className={featured ? "aspect-[16/9] overflow-hidden" : "aspect-[16/9] overflow-hidden"}>
        <img
          src={article.image}
          alt={article.headline}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {article.source} · {relativeDay(article.publishedAt)}
        </p>
        <h3 className={featured ? "mt-1.5 text-base font-semibold" : "mt-1.5 line-clamp-2 text-sm font-semibold"}>
          {article.headline}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{article.description}</p>
      </div>
    </Card>
  );
}