import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type UpdateUserPayload } from "../api/users.api";
import { useAuthStore } from "../store/auth.store";

export { useAgentStats } from "./useAgents";

export const userKeys = {
  me:          ["users", "me"]          as const,
  stats:       ["users", "me", "stats"] as const,
  leaderboard: ["users", "leaderboard"] as const,
  all:         ["users", "all"]         as const,
};

export const useMe = () =>
  useQuery({ queryKey: userKeys.me, queryFn: usersApi.getMe, staleTime: 60_000 });

export const useMyStats = () =>
  useQuery({ queryKey: userKeys.stats, queryFn: usersApi.getMyStats, staleTime: 30_000 });

export const useLeaderboard = (limit = 10) =>
  useQuery({
    queryKey: [...userKeys.leaderboard, limit],
    queryFn: () => usersApi.getLeaderboard(limit),
    staleTime: 60_000,
  });

export const useAllUsers = () =>
  useQuery({ queryKey: userKeys.all, queryFn: usersApi.getAllUsers, staleTime: 30_000 });

export const useAdjustCoins = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note?: string }) =>
      usersApi.adjustCoins(id, amount, note),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: ["users", variables.id] });
      qc.invalidateQueries({ queryKey: ["users", variables.id, "agent-stats"] });
    },
  });
};

export const useUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.updateRole(id, role),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: ["users", variables.id] });
      qc.invalidateQueries({ queryKey: ["users", variables.id, "agent-stats"] });
    },
  });
};

export const useBanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.banUser(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: ["users", id] });
      qc.invalidateQueries({ queryKey: ["users", id, "agent-stats"] });
    },
  });
};

export const useUnbanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unbanUser(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: ["users", id] });
      qc.invalidateQueries({ queryKey: ["users", id, "agent-stats"] });
    },
  });
};

export const useUser = (id: string) =>
  useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });

export const useUpdateMe = () => {
  const qc      = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.updateMe(payload),
    onSuccess: (data) => {
      setUser(data);
      qc.invalidateQueries({ queryKey: userKeys.me });
    },
  });
};
