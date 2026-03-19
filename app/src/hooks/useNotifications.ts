import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import { connectNotifSocket, disconnectNotifSocket } from '../lib/socket';
import { useAuthStore } from '../store/auth.store';

export const notificationKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
};

export const useNotifications = () =>
  useQuery({ queryKey: notificationKeys.all, queryFn: notificationsApi.getAll, staleTime: 15_000 });

export const useUnreadCount = () =>
  useQuery({ queryKey: notificationKeys.unread, queryFn: notificationsApi.getUnreadCount, staleTime: 15_000 });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteOne(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

/** Connect to the notifications WebSocket and invalidate queries on new events */
export const useRealtimeNotifications = () => {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectNotifSocket();

    const handler = () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    };

    socket.on('notification:new', handler);

    return () => {
      // Only remove the listener — do NOT disconnect the socket here.
      // Disconnecting on cleanup causes the StrictMode double-invoke to
      // immediately close the connection before it finishes opening.
      socket.off('notification:new', handler);
    };
  }, [isAuthenticated, qc]);
};
