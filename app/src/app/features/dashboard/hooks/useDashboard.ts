import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../../../../api/payments.api";
import { roomsApi, type RoomQuery } from "../../../../api/rooms.api";
import { usersApi } from "../../../../api/users.api";
import { useWalletStore } from "../../../../store/wallet.store";

export { useMe, useMyStats } from "../../../../hooks/useUser";
export { useUnreadCount } from "../../../../hooks/useNotifications";

export const useLeaderboard = (limit = 10) =>
  useQuery({
    queryKey: ["users", "leaderboard", limit],
    queryFn: () => usersApi.getLeaderboard(limit),
    staleTime: 60_000,
  });

export const useRooms = (query?: RoomQuery) =>
  useQuery({
    queryKey: ["rooms", query],
    queryFn: () => roomsApi.getAll(query),
    refetchInterval: 5000,
  });

export const useClaimDailyBonus = () => {
  const qc = useQueryClient();
  const setBalance = useWalletStore((s) => s.setBalance);
  return useMutation({
    mutationFn: paymentsApi.claimDailyBonus,
    onSuccess: (data: { newBalance?: number }) => {
      if (typeof data.newBalance === "number") {
        setBalance(data.newBalance);
      }
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
};
