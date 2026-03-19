import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentsApi } from '../api/tournaments.api';
import { getErrorMessage } from '../lib/errors';
import { useWalletStore } from '../store/wallet.store';
import { toast } from '../store/toast.store';

export const tournamentKeys = {
  all: ['tournaments'] as const,
  prizePool: ['tournaments', 'prize-pool'] as const,
};

export const useTournaments = () =>
  useQuery({ queryKey: tournamentKeys.all, queryFn: tournamentsApi.getAll, staleTime: 30_000 });

export const usePrizePool = () =>
  useQuery({ queryKey: tournamentKeys.prizePool, queryFn: tournamentsApi.getPrizePool, staleTime: 60_000 });

export const useLeaderboard = () =>
  useQuery({ queryKey: ['tournaments', 'leaderboard'], queryFn: tournamentsApi.getLeaderboard, staleTime: 60_000 });

export const useJoinTournament = () => {
  const qc = useQueryClient();
  const setBalance = useWalletStore((s) => s.setBalance);
  return useMutation({
    mutationFn: (id: string) => tournamentsApi.join(id),
    onSuccess: (data) => {
      setBalance(data.newBalance);
      qc.invalidateQueries({ queryKey: tournamentKeys.all });
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Successfully joined the tournament! 🏆');
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Failed to join tournament'));
    },
  });
};

export const useCreateTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tournamentsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: tournamentKeys.all }); toast.success('Tournament created!'); },
    onError: (err: unknown) => { toast.error(getErrorMessage(err, 'Failed to create tournament')); },
  });
};

export const useFinishTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, winnerUserId }: { id: string; winnerUserId: string }) =>
      tournamentsApi.finish(id, winnerUserId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: tournamentKeys.all });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`🏆 Tournament finished! ${data.prize.toLocaleString()} coins paid out.`);
    },
    onError: (err: unknown) => { toast.error(getErrorMessage(err, 'Failed to finish tournament')); },
  });
};
