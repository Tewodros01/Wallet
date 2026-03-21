import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  paymentsApi,
  type DepositPayload,
  type TransferPayload,
  type WithdrawalPayload,
} from "../api/payments.api";
import { useWalletStore } from "../store/wallet.store";

export const paymentKeys = {
  deposits:    ["payments", "deposits"]    as const,
  withdrawals: ["payments", "withdrawals"] as const,
  requestsMine: ["payments", "requests", "mine"] as const,
  requestsPayable: ["payments", "requests", "payable"] as const,
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

export const useMyPaymentRequests = () =>
  useQuery({
    queryKey: paymentKeys.requestsMine,
    queryFn: paymentsApi.getMyPaymentRequests,
  });

export const usePayablePaymentRequests = () =>
  useQuery({
    queryKey: paymentKeys.requestsPayable,
    queryFn: paymentsApi.getPayablePaymentRequests,
  });

export const useCreatePaymentRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.createPaymentRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.requestsMine });
      qc.invalidateQueries({ queryKey: paymentKeys.requestsPayable });
    },
  });
};

export const usePayPaymentRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.payPaymentRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.requestsMine });
      qc.invalidateQueries({ queryKey: paymentKeys.requestsPayable });
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useCancelPaymentRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.cancelPaymentRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.requestsMine });
      qc.invalidateQueries({ queryKey: paymentKeys.requestsPayable });
    },
  });
};

export const useClaimDailyBonus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => paymentsApi.claimDailyBonus(),
    onSuccess: () => {
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
      qc.invalidateQueries({ queryKey: ["keno", "history"] });
    },
  });
};

export const useKenoHistory = () =>
  useQuery({ queryKey: ["keno", "history"], queryFn: paymentsApi.getKenoHistory });

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

// ── Admin hooks ──
export const useAdminDeposits = () =>
  useQuery({ queryKey: ["admin", "deposits"], queryFn: paymentsApi.adminGetAllDeposits, refetchInterval: 10_000 });

export const useAdminWithdrawals = () =>
  useQuery({ queryKey: ["admin", "withdrawals"], queryFn: paymentsApi.adminGetAllWithdrawals, refetchInterval: 10_000 });

export const useAdminAnalytics = () =>
  useQuery({ queryKey: ["admin", "analytics"], queryFn: paymentsApi.adminGetAnalytics, staleTime: 60_000 });

export const useAdminApproveDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminApproveDeposit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deposits"] }),
  });
};

export const useAdminRejectDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminRejectDeposit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deposits"] }),
  });
};

export const useAdminApproveWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminApproveWithdrawal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] }),
  });
};

export const useAdminRejectWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.adminRejectWithdrawal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] }),
  });
};
