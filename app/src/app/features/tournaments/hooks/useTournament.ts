import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { tournamentsApi } from "../../../../api/tournaments.api";
import { getErrorMessage } from "../../../../lib/errors";
import { toast } from "../../../../store/toast.store";
import { useWalletStore } from "../../../../store/wallet.store";
import { tournamentKeys } from "../queryKeys";

export function useTournamentCountdown(target: string) {
  const calc = () =>
    Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);

  useEffect(() => {
    const timer = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (secs === 0) return "Starting…";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h > 0 ? `${h}h ` : ""}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export const useTournaments = () =>
  useQuery({
    queryKey: tournamentKeys.all,
    queryFn: tournamentsApi.getAll,
    staleTime: 30_000,
  });

export const usePrizePool = () =>
  useQuery({
    queryKey: tournamentKeys.prizePool,
    queryFn: tournamentsApi.getPrizePool,
    staleTime: 60_000,
  });

export const useLeaderboard = () =>
  useQuery({
    queryKey: tournamentKeys.leaderboard,
    queryFn: tournamentsApi.getLeaderboard,
    staleTime: 60_000,
  });

export const useJoinTournament = () => {
  const qc = useQueryClient();
  const setBalance = useWalletStore((s) => s.setBalance);
  return useMutation({
    mutationFn: (id: string) => tournamentsApi.join(id),
    onSuccess: (data) => {
      setBalance(data.newBalance);
      qc.invalidateQueries({ queryKey: tournamentKeys.all });
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Successfully joined the tournament! 🏆");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to join tournament"));
    },
  });
};

export const useCreateTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tournamentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentKeys.all });
      toast.success("Tournament created!");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to create tournament"));
    },
  });
};

export const useFinishTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, winnerUserId }: { id: string; winnerUserId: string }) =>
      tournamentsApi.finish(id, winnerUserId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: tournamentKeys.all });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        `🏆 Tournament finished! ${data.prize.toLocaleString()} coins paid out.`,
      );
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to finish tournament"));
    },
  });
};
