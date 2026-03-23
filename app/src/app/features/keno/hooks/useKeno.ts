import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../../../../api/payments.api";
import { useWalletStore } from "../../../../store/wallet.store";

export { useMe, useMyStats } from "../../../../hooks/useUser";
export { useUnreadCount } from "../../../../hooks/useNotifications";

export const useKenoPlay = () => {
  const qc = useQueryClient();
  const setBalance = useWalletStore((s) => s.setBalance);
  return useMutation({
    mutationFn: ({ bet, picks }: { bet: number; picks: number[] }) =>
      paymentsApi.playKeno(bet, picks),
    onSuccess: (data) => {
      setBalance(data.newBalance);
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["payments", "keno", "history"] });
    },
  });
};

export const useKenoRoundHistory = () =>
  useQuery({
    queryKey: ["payments", "keno", "history"],
    queryFn: paymentsApi.getKenoHistory,
  });
