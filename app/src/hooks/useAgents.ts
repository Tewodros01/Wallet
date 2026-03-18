import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentsApi } from "../api/agents.api";

export const agentKeys = {
  invite: ["agents", "invite"] as const,
  stats:  ["agents", "stats"]  as const,
};

export const useMyInvite = () =>
  useQuery({ queryKey: agentKeys.invite, queryFn: agentsApi.getMyInvite });

export const useAgentStats = () =>
  useQuery({ queryKey: agentKeys.stats, queryFn: agentsApi.getStats });

export const useUseCode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => agentsApi.useCode(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
};
