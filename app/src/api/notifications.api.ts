import { api } from '../lib/axios';

export interface Notification {
  id: string;
  type: 'WIN' | 'DEPOSIT' | 'INVITE' | 'TOURNAMENT' | 'SYSTEM' | 'MISSION' | 'WITHDRAWAL' | 'TRANSFER';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: (): Promise<Notification[]> => api.get('/notifications').then((r) => r.data),
  getUnreadCount: (): Promise<{ count: number }> => api.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
  deleteOne: (id: string) => api.delete(`/notifications/${id}`).then((r) => r.data),
};
