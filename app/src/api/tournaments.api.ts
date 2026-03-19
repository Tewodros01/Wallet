import { api } from '../lib/axios';
import type {
  CreateTournamentRequest,
  Tournament,
  TournamentLeaderboardEntry,
} from '../types/tournament.types';

export const tournamentsApi = {
  getAll: (): Promise<Tournament[]> => api.get('/tournaments').then((r) => r.data),
  getOne: (id: string): Promise<Tournament> => api.get(`/tournaments/${id}`).then((r) => r.data),
  join: (id: string): Promise<{ success: boolean; newBalance: number }> =>
    api.post(`/tournaments/${id}/join`).then((r) => r.data),
  getPrizePool: (): Promise<{ totalPrize: number }> =>
    api.get('/tournaments/prize-pool').then((r) => r.data),
  getLeaderboard: (): Promise<TournamentLeaderboardEntry[]> =>
    api.get('/tournaments/leaderboard').then((r) => r.data),
  // admin
  create: (dto: CreateTournamentRequest) =>
    api.post('/tournaments', dto).then((r) => r.data),
  finish: (id: string, winnerUserId: string): Promise<{ success: boolean; winner: string; prize: number }> =>
    api.post(`/tournaments/${id}/finish`, { winnerUserId }).then((r) => r.data),
};
