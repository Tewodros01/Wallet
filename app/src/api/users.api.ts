import { api } from "../lib/axios";

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarned: number;
}

export const usersApi = {
  getMe: () => api.get("/users/me").then((r) => r.data),
  updateMe: (payload: UpdateUserPayload) =>
    api.patch("/users/me", payload).then((r) => r.data),
  getMyStats: (): Promise<GameStats> =>
    api.get("/users/me/stats").then((r) => r.data),
  getLeaderboard: (limit = 10) =>
    api.get("/users/leaderboard", { params: { limit } }).then((r) => r.data),
};
