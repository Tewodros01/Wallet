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
  getById: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  getStatsByUserId: (id: string): Promise<GameStats> =>
    api.get(`/users/${id}/stats`).then((r) => r.data),
  adjustCoins: (id: string, amount: number, note?: string) =>
    api.patch(`/users/${id}/coins`, { amount, note }).then((r) => r.data),
  // admin
  getAllUsers: () => api.get("/users").then((r) => r.data),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }).then((r) => r.data),
  getAgentStats: (id: string) =>
    api.get(`/users/${id}/agent-stats`).then((r) => r.data),
  completeOnboarding: () =>
    api.post("/users/me/onboarding-done").then((r) => r.data),
};
