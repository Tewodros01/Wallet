import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { clearClientSession } from "../lib/session";
import { useAuthStore } from "../store/auth.store";
import type { LoginPayload, RegisterPayload } from "../types/auth.types";

export const authKeys = {
  profile: ["auth", "profile"] as const,
  sessions: ["auth", "sessions"] as const,
  telegramStatus: ["auth", "telegram", "status"] as const,
};

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) =>
      setAuth(data.user, data.access_token, data.refresh_token),
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) =>
      setAuth(data.user, data.access_token, data.refresh_token),
  });
};

export const useTelegramLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (initData: string) => authApi.telegramLogin({ initData }),
    onSuccess: (data) =>
      setAuth(data.user, data.access_token, data.refresh_token),
  });
};

export const useLogout = () => {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? ""),
    onSettled: () => {
      clearClientSession();
      queryClient.clear();
    },
  });
};

export const useProfile = () =>
  useQuery({
    queryKey: authKeys.profile,
    queryFn: authApi.getProfile,
    staleTime: 1000 * 60 * 5,
  });

export const useSessions = () =>
  {
    const refreshToken = useAuthStore((s) => s.refreshToken);

    return useQuery({
      queryKey: [...authKeys.sessions, refreshToken] as const,
      queryFn: () => authApi.getSessions(refreshToken ?? undefined),
    });
  };

export const useTelegramStatus = () =>
  useQuery({
    queryKey: authKeys.telegramStatus,
    queryFn: authApi.getTelegramStatus,
  });

export const useSendTelegramMessage = () =>
  useMutation({
    mutationFn: ({
      text,
      parseMode,
    }: {
      text: string;
      parseMode?: "HTML" | "MarkdownV2";
    }) => authApi.sendTelegramMessage({ text, parseMode }),
  });

export const useChangePassword = () =>
  useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => authApi.changePassword(currentPassword, newPassword),
  });

export const useRevokeSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.sessions }),
  });
};

export const useRevokeAllSessions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => {
      clearClientSession();
      qc.clear();
    },
  });
};
