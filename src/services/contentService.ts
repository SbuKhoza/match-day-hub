import { ARTICLES, VIDEOS, buildMatches, getTeam, STANDING, TEAMS } from "./mockData";
import type { Article, LeagueStanding, Match, Team, Video } from "@/types";

/**
 * Content layer. Swap these bodies for real API / Firestore reads later —
 * the components consume only these signatures.
 */
export const contentService = {
  listTeams: async (): Promise<Team[]> => TEAMS,
  getTeam: async (id: string | null): Promise<Team | undefined> => getTeam(id),
  getStanding: async (teamId: string): Promise<LeagueStanding> => ({ ...STANDING, teamId }),
  getTeamMatches: async (
    teamId: string,
  ): Promise<{ previous: Match; current: Match; upcoming: Match[] }> => buildMatches(teamId),
  listArticles: async (limit?: number): Promise<Article[]> =>
    typeof limit === "number" ? ARTICLES.slice(0, limit) : ARTICLES,
  listVideos: async (limit?: number): Promise<Video[]> =>
    typeof limit === "number" ? VIDEOS.slice(0, limit) : VIDEOS,
};