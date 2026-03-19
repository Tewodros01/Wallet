import type { User } from "./user.types";

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface GameRoom {
  id: string;
  name: string;
  status: string;
  maxPlayers: number;
  entryFee: number;
  prizePool: number;
  _count?: {
    players: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  totalEarned: number;
  user?: User;
}

export interface UserStats {
  wins: number;
  winRate: number;
  totalGames: number;
}

export interface QuickActionItem {
  label: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  path: string;
}

export interface StatCardItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
}