import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { missionsApi } from "../../../../api/missions.api";
import { paymentsApi } from "../../../../api/payments.api";
import { roomsApi, type RoomQuery } from "../../../../api/rooms.api";
import { tournamentsApi } from "../../../../api/tournaments.api";
import { transactionApi } from "../../../../api/transaction.api";
import type { UpdateMissionRequest } from "../../../../types/mission.types";

export {
  useAdjustCoins,
  useAllUsers,
  useBanUser,
  useUnbanUser,
  useUpdateRole,
  useUser,
} from "../../../../hooks/useUser";

export const useAdminDeposits = () =>
  useQuery({
    queryKey: ["payments", "admin", "deposits"],
    queryFn: paymentsApi.adminGetAllDeposits,
    refetchInterval: 10_000,
  });

export const useAdminWithdrawals = () =>
  useQuery({
    queryKey: ["payments", "admin", "withdrawals"],
    queryFn: paymentsApi.adminGetAllWithdrawals,
    refetchInterval: 10_000,
  });

export const useAdminAnalytics = () =>
  useQuery({
    queryKey: ["payments", "admin", "analytics"],
    queryFn: paymentsApi.adminGetAnalytics,
    staleTime: 60_000,
  });

export const useAdminApproveDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminApproveDeposit(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payments", "admin", "deposits"] }),
  });
};

export const useAdminRejectDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminRejectDeposit(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payments", "admin", "deposits"] }),
  });
};

export const useAdminApproveWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminApproveWithdrawal(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payments", "admin", "withdrawals"] }),
  });
};

export const useAdminRejectWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminRejectWithdrawal(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payments", "admin", "withdrawals"] }),
  });
};

export const useRooms = (query?: RoomQuery) =>
  useQuery({
    queryKey: ["rooms", query],
    queryFn: () => roomsApi.getAll(query),
    refetchInterval: 5000,
  });

export const useRemoveRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
};

export const useCancelRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
};

export const useFinishRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.finish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
};

export const useTournaments = () =>
  useQuery({
    queryKey: ["tournaments"],
    queryFn: tournamentsApi.getAll,
    staleTime: 30_000,
  });

export const useCreateTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tournamentsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tournaments"] }),
  });
};

export const useFinishTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, winnerUserId }: { id: string; winnerUserId: string }) =>
      tournamentsApi.finish(id, winnerUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tournaments"] }),
  });
};

export const useUserTransactions = (userId: string) =>
  useQuery({
    queryKey: ["userTransactions", userId],
    queryFn: () => transactionApi.getByUserId(userId),
    enabled: !!userId,
  });

export const useMissions = (type?: "DAILY" | "WEEKLY") =>
  useQuery({
    queryKey: type ? ["missions", type] : ["missions"],
    queryFn: () => missionsApi.getAll(type),
    staleTime: 30_000,
  });

export const useCreateMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: missionsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }),
  });
};

export const useUpdateMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMissionRequest }) =>
      missionsApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }),
  });
};

export const useDeleteMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => missionsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }),
  });
};

export const useSeedMissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: missionsApi.seed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }),
  });
};
