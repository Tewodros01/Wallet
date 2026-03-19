import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { missionsApi } from '../api/missions.api';
import { useWalletStore } from '../store/wallet.store';
import { toast } from '../store/toast.store';

export const missionKeys = {
  all: ['missions'] as const,
  daily: ['missions', 'DAILY'] as const,
  weekly: ['missions', 'WEEKLY'] as const,
  streak: ['missions', 'streak'] as const,
};

export const useMissions = (type?: 'DAILY' | 'WEEKLY') =>
  useQuery({
    queryKey: type ? ['missions', type] : missionKeys.all,
    queryFn: () => missionsApi.getAll(type),
    staleTime: 30_000,
  });

export const useStreak = () =>
  useQuery({ queryKey: missionKeys.streak, queryFn: missionsApi.getStreak, staleTime: 60_000 });

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
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`+${data.reward} coins claimed! 🎉`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to claim reward');
    },
  });
};

export const useCreateMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: missionsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: missionKeys.all }); toast.success('Mission created!'); },
    onError: (err: any) => { toast.error(err?.response?.data?.message ?? 'Failed to create mission'); },
  });
};

export const useUpdateMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => missionsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: missionKeys.all }); toast.success('Mission updated!'); },
    onError: (err: any) => { toast.error(err?.response?.data?.message ?? 'Failed to update mission'); },
  });
};

export const useDeleteMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => missionsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: missionKeys.all }); toast.success('Mission deleted!'); },
    onError: (err: any) => { toast.error(err?.response?.data?.message ?? 'Failed to delete mission'); },
  });
};

export const useSeedMissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: missionsApi.seed,
    onSuccess: (data: any) => { qc.invalidateQueries({ queryKey: missionKeys.all }); toast.success(data.message ?? 'Seeded!'); },
    onError: (err: any) => { toast.error(err?.response?.data?.message ?? 'Failed to seed'); },
  });
};
