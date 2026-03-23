import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../api/notifications.api";
import { connectNotifSocket } from "../lib/socket";
import { useAuthStore } from "../store/auth.store";
import { usePreferencesStore } from "../store/preferences.store";

export const notificationKeys = {
  all: ["notifications"] as const,
  unread: ["notifications", "unread"] as const,
};

export const useNotifications = () =>
  useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationsApi.getAll,
    staleTime: 15_000,
  });

export const useUnreadCount = () => {
  const notificationsEnabled = usePreferencesStore(
    (state) => state.notificationsEnabled,
  );

  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: notificationsApi.getUnreadCount,
    staleTime: 15_000,
    enabled: notificationsEnabled,
    initialData: { count: 0 },
  });
};

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

export const useRealtimeNotifications = () => {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const notificationsEnabled = usePreferencesStore(
    (state) => state.notificationsEnabled,
  );

  useEffect(() => {
    if (!isAuthenticated || !notificationsEnabled) return;

    const socket = connectNotifSocket();

    const handler = () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    };

    socket.on("notification:new", handler);

    return () => {
      socket.off("notification:new", handler);
    };
  }, [isAuthenticated, notificationsEnabled, qc]);
};
