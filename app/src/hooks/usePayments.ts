import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, type DepositPayload, type WithdrawalPayload } from "../api/payments.api";

export const paymentKeys = {
  deposits:    ["payments", "deposits"]    as const,
  withdrawals: ["payments", "withdrawals"] as const,
};

export const useAgents = () =>
  useQuery({ queryKey: ["payments", "agents"], queryFn: paymentsApi.getAgents });

export const useDeposits = () =>
  useQuery({ queryKey: paymentKeys.deposits, queryFn: paymentsApi.getDeposits });

export const useWithdrawals = () =>
  useQuery({ queryKey: paymentKeys.withdrawals, queryFn: paymentsApi.getWithdrawals });

export const useDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepositPayload) => paymentsApi.deposit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.deposits });
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
      qc.invalidateQueries({ queryKey: paymentKeys.withdrawals });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
};

export const useClaimDailyBonus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (coins: number) => paymentsApi.claimDailyBonus(coins),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
};

export const useAgentRequests = () =>
  useQuery({ queryKey: ["agent", "requests"], queryFn: paymentsApi.getAgentRequests, refetchInterval: 10_000 });

export const useAgentApproveDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentApproveDeposit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent", "requests"] }),
  });
};

export const useAgentRejectDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentRejectDeposit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent", "requests"] }),
  });
};

export const useAgentApproveWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentApproveWithdrawal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent", "requests"] }),
  });
};

export const useAgentRejectWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentRejectWithdrawal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent", "requests"] }),
  });
};
