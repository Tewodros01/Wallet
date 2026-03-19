import { api } from '../lib/axios';

export interface Tournament {
  id: string;
  name: string;
  subtitle?: string;
  prize: number;
  entryFee: number;
  maxPlayers: number;
  joinedCount: number;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  sponsored?: string;
  startsAt: string;
  finishedAt?: string;
  isJoined: boolean;
}

export const tournamentsApi = {
  getAll: (): Promise<Tournament[]> => api.get('/tournaments').then((r) => r.data),
  getOne: (id: string): Promise<Tournament> => api.get(`/tournaments/${id}`).then((r) => r.data),
  join: (id: string): Promise<{ success: boolean; newBalance: number }> =>
    api.post(`/tournaments/${id}/join`).then((r) => r.data),
  getPrizePool: (): Promise<{ totalPrize: number }> =>
    api.get('/tournaments/prize-pool').then((r) => r.data),
  // admin
  create: (dto: { name: string; subtitle?: string; prize: number; entryFee: number; maxPlayers: number; startsAt: string; sponsored?: string }) =>
    api.post('/tournaments', dto).then((r) => r.data),
  finish: (id: string, winnerUserId: string): Promise<{ success: boolean; winner: string; prize: number }> =>
    api.post(`/tournaments/${id}/finish`, { winnerUserId }).then((r) => r.data),
};
