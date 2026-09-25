import { initFirebase } from "@/firebase";
import type { Article, ArticleCategory, Video } from "@/types";
import { listNews, listVideos } from "./adminService";

/** Editorial content published by administrators in the admin area. */
async function news(): Promise<Article[]> {
  const { db } = await initFirebase();
  return listNews(db).catch(() => []);
}

export const contentService = {
  listArticles: async (limit?: number): Promise<Article[]> => (await news()).slice(0, limit),
  listArticlesByCategory: async (category: ArticleCategory, limit?: number): Promise<Article[]> =>
    (await news()).filter((a) => a.category === category).slice(0, limit),
  listVideos: async (limit?: number): Promise<Video[]> => {
    const { db } = await initFirebase();
    return (await listVideos(db).catch(() => [])).slice(0, limit);
  },
};
