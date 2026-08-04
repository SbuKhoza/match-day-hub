export type ThemeMode = "light" | "dark";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  favoriteTeam: string | null;
  createdAt: string;
  theme: ThemeMode;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  league: string;
  primary: string;
}

export interface MatchTeam {
  id: string;
  name: string;
  shortName: string;
}

export type MatchStatus = "finished" | "live" | "upcoming";

export interface Match {
  id: string;
  status: MatchStatus;
  competition: string;
  kickoff: string;
  venue: string;
  home: MatchTeam;
  away: MatchTeam;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
}

export interface LeagueStanding {
  position: number;
  teamId: string;
  played: number;
  points: number;
  form: ("W" | "D" | "L")[];
}

export type ArticleCategory = "team" | "league" | "fantasy";

export interface Article {
  id: string;
  headline: string;
  description: string;
  image: string;
  source: string;
  publishedAt: string;
  category: ArticleCategory;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
}