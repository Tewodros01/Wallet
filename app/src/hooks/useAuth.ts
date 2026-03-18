import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import type { LoginPayload, RegisterPayload } from "../types/auth.types";

export const authKeys = {
  profile: ["auth", "profile"] as const,
  sessions: ["auth", "sessions"] as const,
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

export const useLogout = () => {
  const { refreshToken, clear } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? ""),
    onSettled: () => {
      clear();
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
  useQuery({
    queryKey: authKeys.sessions,
    queryFn: authApi.getSessions,
  });

export const useChangePassword = () =>
  useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(currentPassword, newPassword),
  });

export const useRevokeSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.sessions }),
  });
};

export const useRevokeAllSessions = () => {
  const { clear } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => { clear(); qc.clear(); },
  });
};
