import { useQuery } from "@tanstack/react-query";

import { NewsCard } from "@/components/home/NewsCard";
import { PageHeader } from "@/components/common/PageHeader";
import { contentService } from "@/services/contentService";

export function NewsScreen() {
  const { data } = useQuery({ queryKey: ["news"], queryFn: () => contentService.listArticles() });

  return (
    <div>
      <PageHeader title="News" subtitle="Match reports, transfers and analysis." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}