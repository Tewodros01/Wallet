import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  paymentsApi,
  type DepositPayload,
  type TransferPayload,
  type WithdrawalPayload,
} from "../../../../api/payments.api";
import { useWalletStore } from "../../../../store/wallet.store";
import { paymentKeys } from "../queryKeys";

export const useAgents = () =>
  useQuery({ queryKey: paymentKeys.agents(), queryFn: paymentsApi.getAgents });

export const useDeposits = () =>
  useQuery({
    queryKey: paymentKeys.deposits(),
    queryFn: paymentsApi.getDeposits,
  });

export const useWithdrawals = () =>
  useQuery({
    queryKey: paymentKeys.withdrawals(),
    queryFn: paymentsApi.getWithdrawals,
  });

export const useDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepositPayload) => paymentsApi.deposit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.deposits() });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
};

export const useWithdraw = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawalPayload) => paymentsApi.withdraw(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.withdrawals() });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
};

export const useTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferPayload) => paymentsApi.transfer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useClaimDailyBonus = () => {
  const qc = useQueryClient();
  const setBalance = useWalletStore((s) => s.setBalance);
  return useMutation({
    mutationFn: () => paymentsApi.claimDailyBonus(),
    onSuccess: (data: { newBalance?: number }) => {
      if (typeof data.newBalance === "number") {
        setBalance(data.newBalance);
      }
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
};

export const usePlayKeno = () => {
  const qc = useQueryClient();
  const setBalance = useWalletStore((s) => s.setBalance);
  return useMutation({
    mutationFn: ({ bet, picks }: { bet: number; picks: number[] }) =>
      paymentsApi.playKeno(bet, picks),
    onSuccess: (data) => {
      setBalance(data.newBalance);
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: paymentKeys.keno.history() });
    },
  });
};

export const useKenoHistory = () =>
  useQuery({
    queryKey: paymentKeys.keno.history(),
    queryFn: paymentsApi.getKenoHistory,
  });

export const useAgentRequests = () =>
  useQuery({
    queryKey: paymentKeys.agent.requests(),
    queryFn: paymentsApi.getAgentRequests,
    refetchInterval: 10_000,
  });

export const useAgentApproveDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentApproveDeposit(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paymentKeys.agent.requests() }),
  });
};

export const useAgentRejectDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentRejectDeposit(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paymentKeys.agent.requests() }),
  });
};

export const useAgentApproveWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentApproveWithdrawal(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paymentKeys.agent.requests() }),
  });
};

export const useAgentRejectWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentRejectWithdrawal(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paymentKeys.agent.requests() }),
  });
};

export const useAdminDeposits = () =>
  useQuery({
    queryKey: paymentKeys.admin.deposits(),
    queryFn: paymentsApi.adminGetAllDeposits,
    refetchInterval: 10_000,
  });

export const useAdminWithdrawals = () =>
  useQuery({
    queryKey: paymentKeys.admin.withdrawals(),
    queryFn: paymentsApi.adminGetAllWithdrawals,
    refetchInterval: 10_000,
  });

export const useAdminAnalytics = () =>
  useQuery({
    queryKey: paymentKeys.admin.analytics(),
    queryFn: paymentsApi.adminGetAnalytics,
    staleTime: 60_000,
  });

export const useAdminApproveDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminApproveDeposit(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paymentKeys.admin.deposits() }),
  });
};

export const useAdminRejectDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminRejectDeposit(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paymentKeys.admin.deposits() }),
  });
};

export const useAdminApproveWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminApproveWithdrawal(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paymentKeys.admin.withdrawals() }),
  });
};

export const useAdminRejectWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminRejectWithdrawal(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paymentKeys.admin.withdrawals() }),
  });
};
