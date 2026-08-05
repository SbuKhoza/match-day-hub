export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  clubId: string;
  price: number;
  totalPoints: number;
  form: number;
}

export interface FantasyTeam {
  uid: string;
  name: string;
  squad: string[];
  starters: string[];
  captainId: string | null;
  viceCaptainId: string | null;
  budgetSpent: number;
  gameweek: number;
  totalPoints: number;
  updatedAt: string;
}

export interface League {
  id: string;
  name: string;
  code: string;
  ownerUid: string;
  memberUids: string[];
  createdAt: string;
}

export interface Gameweek {
  id: string;
  number: number;
  status: "upcoming" | "live" | "finished";
  deadline: string;
}

export interface Transfer {
  id: string;
  uid: string;
  gameweek: number;
  outPlayerId: string;
  inPlayerId: string;
  createdAt: string;
}

export interface PlayerStatLine {
  appeared: boolean;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  penaltySaves: number;
  penaltyMisses: number;
  yellowCards: number;
  redCards: number;
}

export interface PlayerPoints {
  id: string;
  playerId: string;
  gameweek: number;
  stats: PlayerStatLine;
  points: number;
}

export const SQUAD_RULES = {
  budget: 100_000_000,
  maxPerClub: 3,
  starters: 11,
  positions: { GK: 2, DEF: 6, MID: 6, FWD: 3 } as Record<PlayerPosition, number>,
} as const;

export const SQUAD_SIZE = 17;
