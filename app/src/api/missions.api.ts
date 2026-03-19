import { api } from '../lib/axios';

export interface Mission {
  id: string;
  title: string;
  desc: string;
  reward: number;
  total: number;
  type: 'DAILY' | 'WEEKLY';
  category: string;
  icon: string;
  progress: number;
  claimed: boolean;
  claimedAt?: string;
}

export const missionsApi = {
  getAll: (type?: 'DAILY' | 'WEEKLY'): Promise<Mission[]> =>
    api.get('/missions', { params: type ? { type } : {} }).then((r) => r.data),
  claim: (id: string): Promise<{ success: boolean; reward: number; newBalance: number }> =>
    api.post(`/missions/${id}/claim`).then((r) => r.data),
  getStreak: (): Promise<{ streak: number }> =>
    api.get('/missions/streak').then((r) => r.data),
  // admin
  create: (dto: { title: string; desc: string; reward: number; total: number; type: string; category: string; icon?: string }) =>
    api.post('/missions', dto).then((r) => r.data),
  update: (id: string, dto: Partial<{ title: string; desc: string; reward: number; total: number; isActive: boolean; icon: string }>) =>
    api.patch(`/missions/${id}`, dto).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/missions/${id}`).then((r) => r.data),
  seed: () =>
    api.post('/missions/seed').then((r) => r.data),
};
