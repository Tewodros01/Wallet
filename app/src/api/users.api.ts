import { api } from "../lib/axios";
import type {
  FinancialAccount,
  FinancialAccountPayload,
  UpdateFinancialAccountPayload,
} from "../types/financial-account.types";
import type { User } from "../types/user.types";

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

export interface LeaderboardUserEntry {
  rank: number;
  totalEarned: number;
  wins: number;
  user?: User;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  user: User;
}

export const usersApi = {
  getMe: () => api.get<User>("/users/me").then((r) => r.data),
  updateMe: (payload: UpdateUserPayload) =>
    api.patch<User>("/users/me", payload).then((r) => r.data),
  getFinancialAccounts: (): Promise<FinancialAccount[]> =>
    api.get("/users/me/financial-accounts").then((r) => r.data),
  createFinancialAccount: (payload: FinancialAccountPayload) =>
    api.post<FinancialAccount>("/users/me/financial-accounts", payload).then((r) => r.data),
  updateFinancialAccount: (id: string, payload: UpdateFinancialAccountPayload) =>
    api.patch<FinancialAccount>(`/users/me/financial-accounts/${id}`, payload).then((r) => r.data),
  removeFinancialAccount: (id: string) =>
    api.post(`/users/me/financial-accounts/${id}/remove`).then((r) => r.data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<UploadAvatarResponse>("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  getMyStats: (): Promise<GameStats> =>
    api.get("/users/me/stats").then((r) => r.data),
  getLeaderboard: (limit = 10) =>
    api.get<LeaderboardUserEntry[]>("/users/leaderboard", { params: { limit } }).then((r) => r.data),
  getById: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),
  getStatsByUserId: (id: string): Promise<GameStats> =>
    api.get(`/users/${id}/stats`).then((r) => r.data),
  adjustCoins: (id: string, amount: number, note?: string) =>
    api.patch(`/users/${id}/coins`, { amount, note }).then((r) => r.data),
  // admin
  getAllUsers: () => api.get<User[]>("/users").then((r) => r.data),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }).then((r) => r.data),
  getAgentStats: (id: string) =>
    api.get(`/users/${id}/agent-stats`).then((r) => r.data),
  completeOnboarding: () =>
    api.post("/users/me/onboarding-done").then((r) => r.data),
  banUser: (id: string) => api.post(`/users/${id}/ban`).then((r) => r.data),
  unbanUser: (id: string) => api.post(`/users/${id}/unban`).then((r) => r.data),
};
