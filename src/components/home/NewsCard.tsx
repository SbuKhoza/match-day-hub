import { Card } from "@/components/common/Card";
import type { Article } from "@/types";
import { relativeDay } from "@/utils/format";

export function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-lifted">
      <div className={featured ? "aspect-[16/9] overflow-hidden" : "aspect-[16/10] overflow-hidden"}>
        <img
          src={article.image}
          alt={article.headline}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {article.source} · {relativeDay(article.publishedAt)}
        </p>
        <h3 className={featured ? "mt-2 text-xl font-semibold" : "mt-2 text-base font-semibold"}>
          {article.headline}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.description}</p>
      </div>
    </Card>
  );
}