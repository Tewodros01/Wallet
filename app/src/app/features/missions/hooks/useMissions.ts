import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { missionsApi } from "../../../../api/missions.api";
import { getErrorMessage } from "../../../../lib/errors";
import { useWalletStore } from "../../../../store/wallet.store";
import { toast } from "../../../../store/toast.store";
import type { UpdateMissionRequest } from "../../../../types/mission.types";

export const missionKeys = {
  all: ["missions"] as const,
  daily: ["missions", "DAILY"] as const,
  weekly: ["missions", "WEEKLY"] as const,
  streak: ["missions", "streak"] as const,
};

export const useMissions = (type?: "DAILY" | "WEEKLY") =>
  useQuery({
    queryKey: type ? ["missions", type] : missionKeys.all,
    queryFn: () => missionsApi.getAll(type),
    staleTime: 30_000,
  });

export const useStreak = () =>
  useQuery({
    queryKey: missionKeys.streak,
    queryFn: missionsApi.getStreak,
    staleTime: 60_000,
  });

export const useClaimMission = () => {
  const qc = useQueryClient();
  const setBalance = useWalletStore((s) => s.setBalance);
  return useMutation({
    mutationFn: (id: string) => missionsApi.claim(id),
    onSuccess: (data) => {
      setBalance(data.newBalance);
      qc.invalidateQueries({ queryKey: missionKeys.all });
      qc.invalidateQueries({ queryKey: missionKeys.daily });
      qc.invalidateQueries({ queryKey: missionKeys.weekly });
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`+${data.reward} coins claimed! 🎉`);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to claim reward"));
    },
  });
};

export const useCreateMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: missionsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.all });
      toast.success("Mission created!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to create mission"));
    },
  });
};

export const useUpdateMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMissionRequest }) =>
      missionsApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.all });
      toast.success("Mission updated!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update mission"));
    },
  });
};

export const useDeleteMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => missionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.all });
      toast.success("Mission deleted!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to delete mission"));
    },
  });
};

export const useSeedMissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: missionsApi.seed,
    onSuccess: (data: { message?: string }) => {
      qc.invalidateQueries({ queryKey: missionKeys.all });
      toast.success(data.message ?? "Seeded!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to seed"));
    },
  });
};
