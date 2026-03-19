import { api } from '../lib/axios';
import type {
  CreateMissionRequest,
  MissionWithProgress,
  UpdateMissionRequest,
} from '../types/mission.types';

export const missionsApi = {
  getAll: (type?: 'DAILY' | 'WEEKLY'): Promise<MissionWithProgress[]> =>
    api.get('/missions', { params: type ? { type } : {} }).then((r) => r.data),
  claim: (id: string): Promise<{ success: boolean; reward: number; newBalance: number }> =>
    api.post(`/missions/${id}/claim`).then((r) => r.data),
  getStreak: (): Promise<{ streak: number }> =>
    api.get('/missions/streak').then((r) => r.data),
  // admin
  create: (dto: CreateMissionRequest) =>
    api.post('/missions', dto).then((r) => r.data),
  update: (id: string, dto: UpdateMissionRequest) =>
    api.patch(`/missions/${id}`, dto).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/missions/${id}`).then((r) => r.data),
  seed: () =>
    api.post('/missions/seed').then((r) => r.data),
};
