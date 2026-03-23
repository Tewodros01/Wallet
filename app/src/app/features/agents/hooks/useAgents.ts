import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../../../../api/payments.api";

export { agentKeys, useAgentStats, useMyInvite, useUseCode } from "../../../../hooks/useAgents";
export { useMe, userKeys } from "../../../../hooks/useUser";

export const useAgentRequests = () =>
  useQuery({
    queryKey: ["payments", "agent", "requests"],
    queryFn: paymentsApi.getAgentRequests,
    refetchInterval: 10_000,
  });

export const useAgentApproveDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentApproveDeposit(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payments", "agent", "requests"] }),
  });
};

export const useAgentRejectDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentRejectDeposit(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payments", "agent", "requests"] }),
  });
};

export const useAgentApproveWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentApproveWithdrawal(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payments", "agent", "requests"] }),
  });
};

export const useAgentRejectWithdrawal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.agentRejectWithdrawal(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payments", "agent", "requests"] }),
  });
};
