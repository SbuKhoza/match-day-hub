import { useQuery } from "@tanstack/react-query";

import { EmptyMessage } from "@/components/common/DataState";
import { NewsCard } from "@/components/home/NewsCard";
import { PageHeader } from "@/components/common/PageHeader";
import { contentService } from "@/services/contentService";

export function NewsScreen() {
  const { data } = useQuery({ queryKey: ["news"], queryFn: () => contentService.listArticles() });
  const articles = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="News" subtitle="Match reports, transfers and analysis." />
      {articles.length === 0 ? (
        <EmptyMessage
          title="No news available yet."
          description="Articles appear here once a news source is connected."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
