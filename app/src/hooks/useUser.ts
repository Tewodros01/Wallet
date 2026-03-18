import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type UpdateUserPayload } from "../api/users.api";
import { useAuthStore } from "../store/auth.store";

export const userKeys = {
  me:          ["users", "me"]          as const,
  stats:       ["users", "me", "stats"] as const,
  leaderboard: ["users", "leaderboard"] as const,
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
