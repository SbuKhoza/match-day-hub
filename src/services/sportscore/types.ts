/**
 * Raw SportScore widget API shapes, written from the actual JSON responses
 * (verified against the live endpoints — not guessed).
 * Everything is optional/nullable because the provider omits fields freely.
 */

export interface RawMatch {
  home?: string;
  away?: string;
  home_logo?: string | null;
  away_logo?: string | null;
  home_score?: string | number | null;
  away_score?: string | number | null;
  status?: string;
  status_text?: string;
  time?: string;
  competition?: string;
  competition_logo?: string | null;
  url?: string;
  live_minute?: number | null;
}

export interface RawIncident {
  time?: number | null;
  type?: string;
  type_id?: number;
  side?: "home" | "away" | string;
  player?: string;
  is_goal?: boolean;
  is_card?: boolean;
  is_sub?: boolean;
  player_in?: string;
  player_out?: string;
  home_score?: number;
  away_score?: number;
}

export interface RawLineupPlayer {
  name?: string;
  number?: number | null;
  /** "G" | "D" | "M" | "F" — only present inside a match lineup. */
  position?: string | null;
  captain?: boolean;
  rating?: string | null;
}

export interface RawLineups {
  home_formation?: string | null;
  away_formation?: string | null;
  home_coach?: string | null;
  away_coach?: string | null;
  confirmed?: boolean;
  home_xi?: RawLineupPlayer[];
  home_subs?: RawLineupPlayer[];
  away_xi?: RawLineupPlayer[];
  away_subs?: RawLineupPlayer[];
}

export interface RawMatchStat {
  label?: string;
  home?: number | null;
  away?: number | null;
  suffix?: string | null;
}

export interface RawMatchDetail extends RawMatch {
  incidents?: RawIncident[];
  stats?: RawMatchStat[];
  lineups?: RawLineups | null;
  home_ht_score?: number | null;
  away_ht_score?: number | null;
  tracker?: { id?: string; profile?: string; sport?: string } | null;
}

export interface RawMatchesResponse {
  sport?: string;
  count?: number;
  matches?: RawMatch[];
}

export interface RawMatchResponse {
  sport?: string;
  match?: RawMatchDetail | null;
  updated?: string;
}

export interface RawTeamResponse {
  sport?: string;
  team?: { name?: string; logo?: string | null; slug?: string; url?: string } | null;
  count?: number;
  matches?: RawMatch[];
}

export interface RawStandingRow {
  pos?: number;
  team?: string;
  team_logo?: string | null;
  team_slug?: string;
  team_url?: string;
  p?: number;
  w?: number;
  d?: number;
  l?: number;
  gf?: number;
  ga?: number;
  gd?: number;
  pts?: number;
  promo_color?: string;
  promo_name?: string;
}

export interface RawStandingsResponse {
  sport?: string;
  competition?: string;
  competition_logo?: string | null;
  competition_slug?: string;
  tables?: { group?: string; rows?: RawStandingRow[] }[];
}

export interface RawScorer {
  rank?: number;
  player?: string;
  player_logo?: string | null;
  player_slug?: string;
  player_url?: string;
  team?: string;
  team_logo?: string | null;
  team_slug?: string;
  goals?: number;
  assists?: number;
  matches?: number;
  rating?: number;
  minutes?: number;
}

export interface RawTopScorersResponse {
  sport?: string;
  competition?: string;
  stat_type?: string;
  scorers?: RawScorer[];
}

export interface RawPlayerStats {
  team?: string;
  team_logo?: string | null;
  competition?: string;
  matches?: number;
  goals?: number;
  assists?: number;
  minutes?: number;
  rating?: number;
  yellow_cards?: number;
  red_cards?: number;
  shots?: number;
  shots_on_target?: number;
  passes?: number;
  passes_accuracy?: number;
  tackles?: number;
  interceptions?: number;
  dribbles?: number;
  key_passes?: number;
}

export interface RawPlayerResponse {
  sport?: string;
  player?: { name?: string; logo?: string | null; slug?: string; url?: string } | null;
  /** Frequently null — that does NOT mean the player is unknown. */
  stats?: RawPlayerStats | null;
}
