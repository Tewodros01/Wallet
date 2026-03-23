import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentsApi } from "../api/agents.api";
import { usersApi } from "../api/users.api";

export const agentKeys = {
  invite: ["agents", "invite"] as const,
  stats: ["agents", "stats"] as const,
};

export const useMyInvite = () =>
  useQuery({ queryKey: agentKeys.invite, queryFn: agentsApi.getMyInvite });

export const useAgentStats = (id?: string) =>
  useQuery({
    queryKey: id ? ["users", id, "agent-stats"] : agentKeys.stats,
    queryFn: () => (id ? usersApi.getAgentStats(id) : agentsApi.getStats()),
    enabled: id ? !!id : true,
  });

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
