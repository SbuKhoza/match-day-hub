import type { Article, ArticleCategory, Video } from "@/types";

/**
 * Editorial content layer.
 *
 * The previously bundled sample articles and videos were invented, so they have
 * been removed. These reads return nothing until a real content source is
 * connected, and the screens show empty states instead of made-up stories.
 */
export const contentService = {
  listArticles: async (_limit?: number): Promise<Article[]> => [],
  listArticlesByCategory: async (
    _category: ArticleCategory,
    _limit?: number,
  ): Promise<Article[]> => [],
  listVideos: async (_limit?: number): Promise<Video[]> => [],
};
