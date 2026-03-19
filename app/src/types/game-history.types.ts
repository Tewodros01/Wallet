// ─── Game History Types ──────────────────────────────────────────────────────

export interface GameHistoryItem {
  roomId: string;
  result: "WIN" | "LOSS";
  prize: number;
  joinedAt: string;
  room: {
    name: string;
    host?: {
      id: string;
      username: string;
      avatar?: string;
    };
    _count?: {
      players: number;
    };
  };
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarned: number;
}